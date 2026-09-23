import type { FoodType } from "@/lib/types";
import { HoneyPerk } from "@/lib/perks/honey";
import { structuredClone } from "next/dist/compiled/@edge-runtime/primitives";

export const Honey: FoodType = {
  name: "Honey",
  sprite: "/sap/honey.webp",
  tier: 1,
  perk: HoneyPerk,
  isToken: false,
  effect: {},
  description: "Give one pet the Honey perk: when it faints, summon a 1/1 Bee.",
};
