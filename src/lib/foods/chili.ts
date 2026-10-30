import type { FoodType } from "@/lib/types";
import { ChiliPerk } from "@/lib/perks/chili";
import { givePerkDescription } from "@/lib/perks/give-perk-description";

export const Chili: FoodType = {
  name: "Chili",
  sprite: "/sap/chili.webp",
  tier: 5,
  perk: ChiliPerk,
  isToken: false,
  effect: {},
  description: givePerkDescription(ChiliPerk),
};
