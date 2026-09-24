import type { FoodType } from "@/lib/types";
import { SteakPerk } from "@/lib/perks/steak";
import { structuredClone } from "next/dist/compiled/@edge-runtime/primitives";

export const Steak: FoodType = {
  name: "Steak",
  sprite: "/sap/steak.webp",
  tier: 6,
  perk: SteakPerk,
  isToken: false,
  effect: { },
  description: "Give one pet the Steak perk.  Attack with +20 damage, once.",
};
