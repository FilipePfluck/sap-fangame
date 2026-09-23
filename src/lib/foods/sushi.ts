import type { FoodType } from "@/lib/types";

export const Sushi: FoodType = {
  name: "Sushi",
  sprite: "/sap/sushi.webp",
  tier: 5,
  isToken: false,
  effect: { attack: 1, health: 1 },
  targeting: { random: 3 },
  description: "Give three random pets +1 attack and +1 health.",
};
