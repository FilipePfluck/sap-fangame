import type { FoodType } from "@/lib/types";

export const Chocolate: FoodType = {
  name: "Chocolate",
  sprite: "/sap/chocolate.webp",
  tier: 5,
  isToken: false,
  effect: { attack: 1, health: 1 }, // TODO: Implement XP
  description: "Give one pet +1 experience.",
};
