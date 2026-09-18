import type { FoodType } from "@/lib/types";

export const Melon: FoodType = {
  name: "Melon",
  sprite: "/sap/melon.webp",
  tier: 6,
  isPerk: true,
  isToken: false,
  effect: {},
  description: "Give one pet the Melon perk. Block 20 damage, once.",
};
