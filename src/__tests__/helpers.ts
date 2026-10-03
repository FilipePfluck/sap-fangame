import { PET_REGISTRY } from "@/lib/pets";
import { AbilityStateStore } from "@/lib/game/battle-ability-context";
import type { Ability, PetType } from "@/lib/types";

export function abilityPet(name: string, ability: Ability, tier = 1): PetType {
  return {
    name,
    sprite: "/sap/sloth.webp",
    tier,
    baseAttack: 1,
    baseHealth: 1,
    isToken: false,
    ability,
    description: "",
  };
}

export function registryWith(...pets: PetType[]): Record<string, PetType> {
  return { ...PET_REGISTRY, ...Object.fromEntries(pets.map((p) => [p.name, p])) };
}

export const testAbilityStates = new AbilityStateStore();
