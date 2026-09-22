import type { FoodType } from "@/lib/types";

export const SaladBowl: FoodType = {
  name: "Salad Bowl",
  sprite: "/sap/salad-bowl.webp",
  tier: 3,
  isPerk: false,
  isToken: false,
  effect: { attack: 1, health: 1 }, // TODO: Implement multitarget foods
  targeting: { random: 3 },
  description: "Give two random pets +1 attack and +1 health.",
};
