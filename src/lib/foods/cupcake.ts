import type { FoodType } from "@/lib/types";

export const Cupcake: FoodType = {
  name: "Cupcake",
  sprite: "/sap/cupcake.webp",
  tier: 2,
  isPerk: false,
  isToken: false,
  effect: { attack: 3, health: 3 }, // TODO: Implement temporary stats
  description: "Give one pet +3 attack and +3 health until next turn.",
};
