import type { FoodType } from "@/lib/types";
import { MelonPerk } from "@/lib/perks/melon";

export const Melon: FoodType = {
  name: "Melon",
  sprite: "/sap/melon.webp",
  tier: 6,
  perk: MelonPerk,
  isToken: false,
  effect: {},
  description: "Give one pet the Melon perk. Block 20 damage, once.",
};
