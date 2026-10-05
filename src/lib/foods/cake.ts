import type { FoodType } from "@/lib/types";
import { CakePerk } from "@/lib/perks/cake";

export const Cake: FoodType = {
  name: "Cake",
  sprite: "/sap/cake.webp",
  tier: 3,
  perk: CakePerk,
  isToken: false,
  effect: { },
  description:
    "Give one pet the Cake perk. End turn -> Increase sell value by 1 gold",
};
