import type { FoodType } from "@/lib/types";

export const Chocolate: FoodType = {
  name: "Chocolate",
  sprite: "/sap/chocolate.webp",
  tier: 5,
  isPerk: false,
  isToken: false,
  effect: { experience: 1 },
  description: "Give one pet +1 experience.",
};
