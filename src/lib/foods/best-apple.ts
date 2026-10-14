import type { FoodType } from "@/lib/types";

export const BestApple: FoodType = {
  name: "Best Apple",
  sprite: "/sap/Best_Apple.png",
  tier: 2,
  foodGroup: "apple",
  isToken: true,
  effect: { attack: 3, health: 3 },
  description: "Give one pet +3 attack and +3 health.",
};