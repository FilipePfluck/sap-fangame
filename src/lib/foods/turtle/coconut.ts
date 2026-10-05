import type { FoodType } from "@/lib/types";
import { CoconutPerk } from "@/lib/perks/turtle/coconut";

export const Coconut: FoodType = {
  name: "Coconut",
  sprite: "/sap/Coconut.png",
  tier: 7,
  perk: CoconutPerk,
  isToken: true,
  effect: {},
  description: "Block damage, once.",
};