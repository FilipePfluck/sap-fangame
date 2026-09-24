import type { FoodType } from "@/lib/types";
import { BreadPerk } from "@/lib/perks/bread";

export const Bread: FoodType = {
  name: "Bread",
  sprite: "/sap/bread.webp",
  tier: 4,
  perk: BreadPerk,
  isToken: false,
  effect: {},
  description:
    "Give one pet the Bread perk. End turn: Gain +7 health until next turn.",
};
