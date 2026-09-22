import type { FoodType } from "@/lib/types";

export const Cake: FoodType = {
  name: "Cake",
  sprite: "/sap/cake.webp",
  tier: 3,
  isPerk: true,
  isToken: false,
  effect: {}, // TODO: Implement perk
  description:
    "Give one pet the Cake perk. End turn -> Increase sell value by 1 gold",
};
