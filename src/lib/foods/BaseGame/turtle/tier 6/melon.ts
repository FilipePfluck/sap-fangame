import type { FoodType } from "@/lib/types";
import { MelonPerk } from "@/lib/perks/melon";
import { givePerkDescription } from "@/lib/perks/give-perk-description";

export const Melon: FoodType = {
  name: "Melon",
  sprite: "/sap/melon.webp",
  tier: 6,
  perk: MelonPerk,
  isToken: false,
  effect: {},
  description: givePerkDescription(MelonPerk),
};
