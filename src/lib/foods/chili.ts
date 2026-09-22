import type { FoodType } from "@/lib/types";

export const Chili: FoodType = {
  name: "Chili",
  sprite: "/sap/chili.webp",
  tier: 5,
  isPerk: true,
  isToken: false,
  effect: { attack: 5 }, // TODO: Implement perk effect
  description:
    "Give one pet the Chili perk.  Attack second enemy for 5 damage.",
};
