import type { FoodType } from "@/lib/types";
import { BreadPerk } from "@/lib/perks/bread";
import { givePerkDescription } from "@/lib/perks/give-perk-description";

export const Bread: FoodType = {
  name: "Bread",
  sprite: "/sap/bread.webp",
  tier: 4,
  perk: BreadPerk,
  isToken: false,
  effect: {},
  description: givePerkDescription(BreadPerk),
};
