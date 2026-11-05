import { PET_REGISTRY } from "@/lib/pets";
import { getMinimumXpFor } from "@/lib/game/board";
import {
  Ability,
  ApiBoard,
  BattleAbilityContext,
  PetData,
  ShopState,
  StaticPet,
} from "@/lib/types";

export const EMPTY_SHOP: Readonly<ShopState> = { shopPets: [], shopFoods: [] };

export function pet(petData: Partial<PetData> = {}): PetData {
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

export function staticPet(name: string, ability: Ability, tier = 1): StaticPet {
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
  return {
    ...PET_REGISTRY,
    ...Object.fromEntries(pets.map((p) => [p.name, p])),
  };
}

export function makeBoard(pets: (PetData | null)[]): ApiBoard {
  const board: ApiBoard = [null, null, null, null, null];
  pets.forEach((p, i) => {
    board[i] = p;
  });
  return board;
}

export function makeShop(
  StaticPets: string[] = [],
  foodTypes: string[] = []
): ShopState {
  return {
    shopPets: StaticPets.map((t) => ({ type: t, frozen: false })),
    shopFoods: foodTypes.map((t) => ({ type: t, frozen: false })),
  };
}

export function battleContext(
  self: PetData,
  team: PetData[],
  enemyTeam: PetData[]
): BattleAbilityContext {
  return {
    self,
    selfIndex: team.indexOf(self),
    team,
    enemyTeam,
    level: self.level,
    summonRequests: [],
    hurtPets: [],
    petRegistry: PET_REGISTRY,
  };
}
