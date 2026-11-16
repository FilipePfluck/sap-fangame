import type { FoodType } from "@/lib/types";
import { CakePerk } from "@/lib/perks/cake";
import { givePerkDescription } from "@/lib/perks/give-perk-description";

export const Cake: FoodType = {
  name: "Cake",
  id: 8,
  sprite: "/sap/cake.webp",
  tier: 3,
  perk: CakePerk,
  isToken: false,
  effect: { },
  description: givePerkDescription(CakePerk),
};
