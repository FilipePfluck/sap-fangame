import type { PetInstance } from "@/lib/types";

export const TIGER = "Tiger";

// Battle only: Tiger repeats the pet ability of the friend ahead of it (never
// perks, and nothing in the shop) as if that friend were this level.
export const TIGER_REPEAT_LEVEL = 1;

// Whether a Tiger sits directly behind position `index` (the pet ahead of a
// Tiger is the one it repeats). Empty slots are skipped. Callers evaluate
// this *before* firing the ability, so an ability that reshuffles the team
// can't change whether it repeats.
export function hasTigerBehind(
  team: readonly (PetInstance | null)[],
  index: number
): boolean {
  if (index < 0) return false;
  for (let i = index + 1; i < team.length; i++) {
    const pet = team[i];
    if (pet) return pet.type === TIGER;
  }
  return false;
}
