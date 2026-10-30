import type { FoodType, StaticPet } from "@/lib/types";
import { SHOP_PET_POOL } from "@/lib/pets";
import { SHOP_FOOD_POOL } from "@/lib/foods";
import { MAX_TIER } from "@/lib/game/rules";
import { getTierUnlockTurn } from "@/lib/game/shop";

export type PackTierRow = Readonly<{
  tier: number;
  unlockTurn: number;
  pets: readonly StaticPet[];
  foods: readonly FoodType[];
}>;

export function getPackTierRows(): readonly PackTierRow[] {
  return Array.from({ length: MAX_TIER }, (_, index) => {
    const tier = index + 1;
    return {
      tier,
      unlockTurn: getTierUnlockTurn(tier),
      pets: SHOP_PET_POOL.filter((pet) => pet.tier === tier),
      foods: SHOP_FOOD_POOL.filter((food) => food.tier === tier),
    };
  });
}
