import type { FoodType } from "@/lib/types";

export const SaladBowl: FoodType = {
  name: "Salad Bowl",
  sprite: "/sap/salad-bowl.webp",
  tier: 3,
  isToken: false,
  effect: { attack: 1, health: 1 },
  targeting: { random: 2 },
  description: "Give two random pets +1 attack and +1 health.",
};
