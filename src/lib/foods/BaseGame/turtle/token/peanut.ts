import type { FoodType } from "@/lib/types";
import { PeanutPerk } from "@/lib/perks/peanut";
import { TOKEN_TIER } from "@/lib/game/rules";

export const Peanut: FoodType = {
  name: "Peanut",
  sprite: "/sap/peanut.webp",
  tier: TOKEN_TIER,
  perk: PeanutPerk,
  isToken: true,
  effect: {},
  description: PeanutPerk.description,
};
