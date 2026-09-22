import type { FoodType } from "@/lib/types";

export const Mushroom: FoodType = {
  name: "Mushroom",
  sprite: "/sap/mushroom.webp",
  tier: 6,
  isPerk: true,
  isToken: false,
  effect: {}, // TODO: Implement perk effect
  description: "Give one pet the Mushroom perk. Faint -> Come back as a 1/1.",
};
