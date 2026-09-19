import type { FoodType } from "@/lib/types";

export const Honey: FoodType = {
  name: "Honey",
  sprite: "/sap/honey.webp",
  tier: 1,
  isPerk: true,
  isToken: false,
  effect: {},
  description: "Give one pet the Honey perk: when it faints, summon a 1/1 Bee.",
};
