import type { FoodType } from "@/lib/types";

export const BreadCrumbs: FoodType = {
  name: "Bread Crumbs",
  sprite: "/sap/bread-crumbs.png",
  tier: 1,
  isPerk: false,
  isToken: true,
  cost: 0,
  effect: { attack: 1 },
};
