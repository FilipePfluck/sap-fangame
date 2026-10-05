import type { FoodType } from "@/lib/types";
import { HoneyPerk } from "@/lib/perks/honey";

export const Honey: FoodType = {
  name: "Honey",
  sprite: "/sap/honey.webp",
  tier: 1,
  perk: HoneyPerk,
  isToken: false,
  effect: {},
  description: "Give one pet the Honey perk: Faint: Summon a 1/1 Bee.",
};
