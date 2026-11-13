import type { FoodType } from "@/lib/types";

export const BetterMilk: FoodType = {
  name: "Better Milk",
  sprite: "/sap/Better_Milk.png",
  tier: 1,
  isToken: true,
  cost: 0,
  effect: { attack: 2, health: 4 },
  description: "Give one pet +2 attack and +4 health.",
};