import type { FoodType } from "@/lib/types";
import { CoconutPerk } from "@/lib/perks/coconut";
import { TOKEN_TIER } from "@/lib/game/rules";

export const Coconut: FoodType = {
  name: "Coconut",
  id: 26,
  sprite: "/sap/Coconut.png",
  tier: TOKEN_TIER,
  perk: CoconutPerk,
  isToken: true,
  effect: {},
  description: CoconutPerk.description,
};