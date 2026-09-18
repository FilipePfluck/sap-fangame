import type { FoodType } from "@/lib/types";

export const Bread: FoodType = {
  name: "Bread",
  sprite: "/sap/bread.webp",
  tier: 4,
  isPerk: true,
  isToken: false,
  effect: {},
  description:
    "Give one pet the Bread perk. End turn: Gain +7 health until next turn.",
};
