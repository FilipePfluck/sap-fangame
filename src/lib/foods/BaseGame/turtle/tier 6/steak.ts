import type { FoodType } from "@/lib/types";
import { SteakPerk } from "@/lib/perks/steak";
import { givePerkDescription } from "@/lib/perks/give-perk-description";

export const Steak: FoodType = {
  name: "Steak",
  id: 16,
  sprite: "/sap/steak.webp",
  tier: 6,
  perk: SteakPerk,
  isToken: false,
  effect: { },
  description: givePerkDescription(SteakPerk),
};
