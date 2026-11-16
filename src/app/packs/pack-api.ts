import type { SavedPackJson } from "@/lib/game/pack-request";
import type { SerializedPack } from "@/lib/types";

export type SavePackResult = Readonly<{ savedPack: SavedPackJson } | { error: string }>;

async function readError(response: Response): Promise<string> {
  const body = await response.json().catch(() => null);
  return typeof body?.error === "string" ? body.error : "Something went wrong";
}

// Creates the pack when `packId` is null, otherwise updates it (api/packs).
export async function savePack(packId: number | null, { name, icon, pets, foods }: SerializedPack): Promise<SavePackResult> {
  const response = await fetch(packId === null ? "/api/packs" : `/api/packs/${packId}`, {
    method: packId === null ? "POST" : "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, icon, pets, foods }),
  });
  if (!response.ok) return { error: await readError(response) };
  return { savedPack: await response.json() };
}

// The error message, or null once the pack is deleted.
export async function deletePack(packId: number): Promise<string | null> {
  const response = await fetch(`/api/packs/${packId}`, { method: "DELETE" });
  return response.ok ? null : readError(response);
}
