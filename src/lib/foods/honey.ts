import type { FoodType } from "@/lib/types";
import { HoneyPerk } from "@/lib/perks/honey";
import { givePerkDescription } from "@/lib/perks/give-perk-description";

export const Honey: FoodType = {
  name: "Honey",
  sprite: "/sap/honey.webp",
  tier: 1,
  perk: HoneyPerk,
  isToken: false,
  effect: {},
  description: givePerkDescription(HoneyPerk),
};
