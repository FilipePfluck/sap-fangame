import type { PetInstance } from "@/lib/types";

export function clonePerk<T extends PetInstance["perk"]>(perk: T): T | null {
  return perk ? ({ ...perk } as T) : null;
}

export function clonePetInstance(pet: PetInstance): PetInstance {
  return { ...pet, perk: clonePerk(pet.perk) };
}
