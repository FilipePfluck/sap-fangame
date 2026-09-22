import type { FoodType } from "@/lib/types";

export const Steak: FoodType = {
  name: "Steak",
  sprite: "/sap/steak.webp",
  tier: 6,
  isPerk: true,
  isToken: false,
  effect: { attack: 20 }, // TODO: Implement perk effect
  description: "Give one pet the Steak perk.  Attack with +20 damage, once.",
};
