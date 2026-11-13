import type { FoodType } from "@/lib/types";
import { GarlicPerk } from "@/lib/perks/garlic";
import { givePerkDescription } from "@/lib/perks/give-perk-description";

export const Garlic: FoodType = {
  name: "Garlic",
  sprite: "/sap/garlic.webp",
  tier: 3,
  perk: GarlicPerk,
  isToken: false,
  effect: {},
  description: givePerkDescription(GarlicPerk),
};
