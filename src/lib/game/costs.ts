import type { FoodType, PetInstance, ShopFood, ShopPet } from "@/lib/types";

// Base gold price of a shop pet, and of any food that doesn't set its own
// `cost`.
export const PET_COST = 3;

// Gold cost of a shop roll.
export const ROLL_COST = 1;

// Every purchase price goes through these two functions — the buy routes
// (authoritative) and the client's affordability check / optimistic gold
// update — so a new price modifier only has to be added here. Today that's a
// per-item `discount` set by abilities; prices never drop below 0.
function discounted(base: number, item: { discount?: number }): number {
  return Math.max(0, base - (item.discount ?? 0));
}

export function getPetCost(pet: ShopPet): number {
  return discounted(PET_COST, pet);
}

export function getFoodCost(item: ShopFood, def: FoodType): number {
  return discounted(def.cost ?? PET_COST, item);
}

// Gold gained for selling a board pet. Same idea as the prices above: the
// sell route and the client's display/optimistic update both read it here.
export function getSellValue(pet: PetInstance): number {
  return pet.level;
}
