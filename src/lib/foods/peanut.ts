import type { FoodType } from "@/lib/types";
import { PeanutPerk } from "@/lib/perks/peanut";

export const Peanut: FoodType = {
  name: "Peanut",
  sprite: "/sap/peanut.webp",
  tier: 5,
  perk: PeanutPerk,
  isToken: true,
  effect: {},
  description: PeanutPerk.description,
};
