import type { PetType, FoodType, ShopPet, ShopFood } from "@/lib/types";

function getPetSlotCount(turn: number): number {
  if (turn >= 9) return 5;
  if (turn >= 5) return 4;
  return 3;
}

function getFoodSlotCount(turn: number): number {
  if (turn >= 5) return 2;
  return 1;
}

export function getUnlockedTiers(turn: number): number[] {
  const tiers: number[] = [1];
  if (turn >= 3) tiers.push(2);
  if (turn >= 5) tiers.push(3);
  if (turn >= 7) tiers.push(4);
  if (turn >= 9) tiers.push(5);
  if (turn >= 11) tiers.push(6);
  return tiers;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export type GenerateShopArgs = {
  turn: number;
  pack: PetType[];
  foodTypes: FoodType[];
  frozenPets?: ShopPet[];
  frozenFoods?: ShopFood[];
};

export type GeneratedShop = {
  shopPets: ShopPet[];
  shopFoods: ShopFood[];
};

export function generateShop({
  turn,
  pack,
  foodTypes,
  frozenPets = [],
  frozenFoods = [],
}: GenerateShopArgs): GeneratedShop {
  const unlockedTiers = getUnlockedTiers(turn);
  const petPool = pack.filter((p) => unlockedTiers.includes(p.tier));
  const foodPool = foodTypes.filter((f) => unlockedTiers.includes(f.tier));

  const petSlots = getPetSlotCount(turn);
  const foodSlots = getFoodSlotCount(turn);

  const shopPets: ShopPet[] = frozenPets.map((p) => ({ ...p, frozen: true }));
  const shopFoods: ShopFood[] = frozenFoods.map((f) => ({ ...f, frozen: true }));

  const petsToFill = petSlots - shopPets.length;
  for (let i = 0; i < petsToFill; i++) {
    if (petPool.length === 0) break;
    shopPets.push({ type: pickRandom(petPool).name, frozen: false });
  }

  const foodsToFill = foodSlots - shopFoods.length;
  for (let i = 0; i < foodsToFill; i++) {
    if (foodPool.length === 0) break;
    shopFoods.push({ type: pickRandom(foodPool).name, frozen: false });
  }

  return { shopPets, shopFoods };
}
