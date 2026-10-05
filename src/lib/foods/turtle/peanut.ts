import type { FoodType } from "@/lib/types";
import { PeanutPerk } from "@/lib/perks/turtle/peanut";

export const Peanut: FoodType = {
  name: "Peanut",
  sprite: "/sap/peanut.webp",
  tier: 5,
  perk: PeanutPerk,
  isToken: true,
  effect: {},
  description:
    "Knock out any pet attacked and hurt by this.",
};
