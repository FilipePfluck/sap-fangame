import { z } from "zod";
import { Pack } from "@/lib/game/pack";
import { MAX_PACK_NAME_LENGTH } from "@/lib/game/rules";
import type { SavedPack } from "@/lib/game/pack-store";
import type { SerializedPack } from "@/lib/types";

// The body of a pack save. isValid isn't sent: Pack.fromSerialized works it out.
const PackRequestSchema = z.object({
  name: z.string().max(MAX_PACK_NAME_LENGTH),
  icon: z.number().int(),
  pets: z.array(z.number().int()),
  foods: z.array(z.number().int()),
});

const PackIdSchema = z.coerce.number().int().positive();

export type PackRequestResult = Readonly<{ pack: Pack } | { error: string }>;

// A saved pack as the packs API sends it.
export type SavedPackJson = Readonly<{
  id: number;
  pack: SerializedPack;
}>;

// The pack doesn't have to be valid (Pack spec: packs are softly enforced), but
// every pet and food ID has to exist (see Pack.fromSerialized).
export function parsePackRequest(body: unknown): PackRequestResult {
  const parsed = PackRequestSchema.safeParse(body);
  if (!parsed.success) return { error: "Invalid request" };
  try {
    return { pack: Pack.fromSerialized({ ...parsed.data, isValid: false }) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Invalid pack" };
  }
}

// Null for anything that isn't a positive whole number.
export function parsePackId(packId: string): number | null {
  const parsed = PackIdSchema.safeParse(packId);
  return parsed.success ? parsed.data : null;
}

export function toSavedPackJson({ id, pack }: SavedPack): SavedPackJson {
  return { id, pack: pack.serialize() };
}
