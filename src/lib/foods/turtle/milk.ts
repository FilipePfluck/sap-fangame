import type { FoodType } from "@/lib/types";

export const Milk: FoodType = {
  name: "Milk",
  sprite: "/sap/Milk.webp",
  tier: 1,
  isToken: true,
  cost: 0,
  effect: { attack: 1, health: 2 },
  description: "Give one pet +1 attack and +2 health.",
};