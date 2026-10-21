import { PET_REGISTRY } from "@/lib/pets";
import { getMinimumXpFor } from "@/lib/game/board";
import type { Ability, PetInstance, ShopState, StaticPet } from "@/lib/types";

export const EMPTY_SHOP: Readonly<ShopState> = { shopPets: [], shopFoods: [] };

export function pet(petData: Partial<PetInstance> = {}): PetInstance {
  const data = structuredClone(petData);
  const level = data.level ?? 1;
  return {
    ...data,
    type: data.type ?? "Sloth",
    attack: data.attack ?? 1,
    health: data.health ?? 1,
    perk: data.perk ?? null,
    level,
    xp: data.xp ?? getMinimumXpFor(level),
  };
}

export function abilityPet(name: string, ability: Ability, tier = 1): StaticPet {
  return {
    name,
    sprite: "/sap/sloth.webp",
    tier,
    baseAttack: 1,
    baseHealth: 1,
    isToken: false,
    abilities: new Map([[ability.trigger, ability]]),
    description: "",
  };
}

export function registryWith(...pets: StaticPet[]): Record<string, StaticPet> {
  return { ...PET_REGISTRY, ...Object.fromEntries(pets.map((p) => [p.name, p])) };
}
