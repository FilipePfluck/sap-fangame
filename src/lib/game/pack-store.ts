import type { Pack as PackRow } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { Pack } from "@/lib/game/pack";
import { MAX_PACKS_PER_USER } from "@/lib/game/rules";
import type { SerializedPack } from "@/lib/types";

// The columns of a Pack row that hold the pack itself (prisma/schema.prisma).
export type PackRowData = Readonly<Pick<PackRow, "name" | "iconId" | "petsId" | "foodsId">>;

// A custom pack as saved by a user.
export type SavedPack = Readonly<{
  id: number;
  pack: Pack;
}>;

// isValid isn't stored; Pack.fromSerialized works it out again.
export function toSerializedPack({ name, iconId, petsId, foodsId }: PackRowData): SerializedPack {
  return { name, icon: iconId, pets: petsId, foods: foodsId, isValid: false };
}

export function toPackRowData({ name, icon, pets, foods }: SerializedPack): PackRowData {
  return { name, iconId: icon, petsId: [...pets], foodsId: [...foods] };
}

// Pack spec: a user can save at most MAX_PACKS_PER_USER packs.
export function hasRoomForPack(savedPackCount: number): boolean {
  return savedPackCount < MAX_PACKS_PER_USER;
}

// Throws for a saved pet or food ID that no longer exists (see Pack.fromSerialized).
function toSavedPack(row: PackRow): SavedPack {
  return { id: row.id, pack: Pack.fromSerialized(toSerializedPack(row)) };
}

export async function loadUserPacks(userId: string): Promise<SavedPack[]> {
  const rows = await prisma.pack.findMany({ where: { ownerId: userId }, orderBy: { createdAt: "asc" } });
  return rows.map(toSavedPack);
}

// Null when the pack doesn't exist or belongs to someone else.
export async function loadUserPack(userId: string, packId: number): Promise<SavedPack | null> {
  const row = await prisma.pack.findFirst({ where: { id: packId, ownerId: userId } });
  return row ? toSavedPack(row) : null;
}

// Null when the user already has MAX_PACKS_PER_USER packs.
export async function createUserPack(userId: string, pack: Pack): Promise<SavedPack | null> {
  const savedPackCount = await prisma.pack.count({ where: { ownerId: userId } });
  if (!hasRoomForPack(savedPackCount)) return null;
  const row = await prisma.pack.create({ data: { ...toPackRowData(pack.serialize()), ownerId: userId } });
  return { id: row.id, pack };
}

// False when the pack doesn't exist or belongs to someone else.
export async function updateUserPack(userId: string, packId: number, pack: Pack): Promise<boolean> {
  const { count } = await prisma.pack.updateMany({
    where: { id: packId, ownerId: userId },
    data: toPackRowData(pack.serialize()),
  });
  return count > 0;
}

// False when the pack doesn't exist or belongs to someone else.
export async function deleteUserPack(userId: string, packId: number): Promise<boolean> {
  const { count } = await prisma.pack.deleteMany({ where: { id: packId, ownerId: userId } });
  return count > 0;
}
