import type { FoodType } from "@/lib/types";

export const Apple: FoodType = {
  name: "Apple",
  sprite: "/sap/apple.png",
  tier: 1,
  isPerk: false,
  isToken: false,
  effect: { attack: 1, health: 1 },
  description: "Give one pet +1 attack and +1 health.",
};
