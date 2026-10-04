import type { ApiBoard, PetInstance } from "@/lib/types";
import { MAX_PET_EXPERIENCE } from "@/lib/game/rules";
import { Board, computeLevel } from "@/lib/game/board";

export function compactBoard(board: Board): PetInstance[] {
  return board.pets?.filter((p) => p !== null);
}

export function compactApiBoard(board: ApiBoard): PetInstance[] {
  return board.filter((p) => p !== null);
}

export function grantExperience(pet: PetInstance, amount: number): void {
  if (pet.health <= 0) return;
  const experienceGained = Math.max(0, Math.floor(amount));
  pet.attack += experienceGained;
  pet.health += experienceGained;
  pet.xp = Math.min(MAX_PET_EXPERIENCE, pet.xp + experienceGained);
  pet.level = computeLevel(pet.xp);
}

function mergedXp(a: PetInstance, b: PetInstance): number {
  return Math.min(MAX_PET_EXPERIENCE, a.xp + b.xp + 1);
}

// A level-up reward is earned whenever merging raises the pet above both
// parents' levels — except merging two level-2 pets (reaching level 3).
export function levelUpRewardEarned(a: PetInstance, b: PetInstance): boolean {
  const mergedLevel = computeLevel(mergedXp(a, b));
  if (mergedLevel <= Math.max(a.level, b.level)) return false;
  return !(a.level === 2 && b.level === 2);
}

export function mergeError(a: PetInstance, b: PetInstance): string | null {
  if (a.type !== b.type) return "Pets must be the same type to merge";
  if (a.xp >= MAX_PET_EXPERIENCE || b.xp >= MAX_PET_EXPERIENCE) {
    return "Pet has reached max experience";
  }
  return null;
}

export function mergePets(a: PetInstance, b: PetInstance): PetInstance {
  const error = mergeError(a, b);
  if (error) throw new Error(error);
  const newXp = mergedXp(a, b);
  // Temp stats ride along with whichever pet supplied the higher stat.
  const attackSource = a.attack >= b.attack ? a : b;
  const healthSource = a.health >= b.health ? a : b;
  const merged: PetInstance = {
    type: a.type,
    attack: Math.max(a.attack, b.attack) + 1,
    health: Math.max(a.health, b.health) + 1,
    perk: a.perk ?? b.perk,
    xp: newXp,
    level: computeLevel(newXp),
  };
  if (attackSource.tempAttack) merged.tempAttack = attackSource.tempAttack;
  if (healthSource.tempHealth) merged.tempHealth = healthSource.tempHealth;
  return merged;
}
