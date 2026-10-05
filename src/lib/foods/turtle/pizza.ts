import type { FoodType } from "@/lib/types";

export const Pizza: FoodType = {
  name: "Pizza",
  sprite: "/sap/pizza.webp",
  tier: 6,
  isToken: false,
  effect: { attack: 2, health: 2 },
  targeting: { random: 2 },
  description: "Give two random pets +2 attack and +2 health.",
};
