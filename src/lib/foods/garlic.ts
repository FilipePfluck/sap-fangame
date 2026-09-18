import type { FoodType } from "@/lib/types";

export const Garlic: FoodType = {
  name: "Garlic",
  sprite: "/sap/garlic.webp",
  tier: 3,
  isPerk: true,
  isToken: false,
  effect: {},
  description:
    "Give one pet the Garlic perk. Take 2 less damage. It can't be reduced to less than 2.",
};
