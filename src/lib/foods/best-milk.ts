import type { FoodType } from "@/lib/types";

export const BestMilk: FoodType = {
  name: "Best Milk",
  sprite: "/sap/Best_Milk.png",
  tier: 1,
  isToken: true,
  cost: 0,
  effect: { attack: 3, health: 6 },
  description: "Give one pet +3 attack and +6 health.",
};