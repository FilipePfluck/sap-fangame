import { PET_REGISTRY } from "@/lib/pets";
import type { Ability, PetData, StaticPet } from "@/lib/types";

export function pet(
  type: string,
  override?: Partial<PetData>,
): PetData {
  const perk = override?.perk ? {...override?.perk} : null;
  return { type, attack: 1, health: 1, xp: 0, level: 1, perk, ...override };
}

export function abilityPet(name: string, ability: Ability, tier = 1): StaticPet {
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

export function registryWith(...pets: StaticPet[]): Record<string, StaticPet> {
  return { ...PET_REGISTRY, ...Object.fromEntries(pets.map((p) => [p.name, p])) };
}
