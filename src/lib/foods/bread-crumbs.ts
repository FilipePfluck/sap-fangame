import type { FoodType } from "@/lib/types";

export const BreadCrumbs: FoodType = {
  name: "Bread Crumbs",
  sprite: "/sap/bread-crumbs.webp",
  tier: 1,
  isPerk: false,
  isToken: true,
  cost: 0,
  effect: { attack: 1 },
  description: "Give one pet +1 attack.",
};
