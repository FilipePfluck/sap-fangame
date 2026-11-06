import type { PetData } from "@/lib/types";

export function clonePerk<T extends PetData["perk"]>(perk: T): T | null {
  return perk ? ({ ...perk } as T) : null;
}

export function clonePetInstance(pet: PetData): PetData {
  return { ...pet, perk: clonePerk(pet.perk) };
}
