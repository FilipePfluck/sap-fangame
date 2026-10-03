import type { FoodType } from "@/lib/types";

export const BetterApple: FoodType = {
  name: "Better Apple",
  sprite: "/sap/Better_Apple.png",
  tier: 2,
  foodGroup: "apple",
  isToken: true,
  effect: { attack: 2, health: 2 },
  description: "Give one pet +2 attack and +2 health.",
};