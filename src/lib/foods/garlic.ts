import type { FoodType } from "@/lib/types";
import { GarlicPerk } from "@/lib/perks/garlic";
import { structuredClone } from "next/dist/compiled/@edge-runtime/primitives";

export const Garlic: FoodType = {
  name: "Garlic",
  sprite: "/sap/garlic.webp",
  tier: 3,
  perk: GarlicPerk,
  isToken: false,
  effect: {},
  description:
    "Give one pet the Garlic perk. Take 2 less damage. It can't be reduced to less than 2.",
};
