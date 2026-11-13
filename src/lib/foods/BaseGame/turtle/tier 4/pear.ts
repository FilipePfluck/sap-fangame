import type { FoodType } from "@/lib/types";

export const Pear: FoodType = {
  name: "Pear",
  sprite: "/sap/pear.webp",
  tier: 4,
  isToken: false,
  effect: { attack: 2, health: 2 },
  description: "Give one pet +2 attack and +2 health.",
};
