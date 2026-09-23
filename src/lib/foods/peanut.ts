import type { FoodType } from "@/lib/types";
import { PeanutPerk } from "@/lib/perks/peanut";
import { structuredClone } from "next/dist/compiled/@edge-runtime/primitives";

export const Peanut: FoodType = {
  name: "Peanut",
  sprite: "/sap/peanut.webp",
  tier: 5,
  perk: PeanutPerk,
  isToken: true,
  effect: {},
  description:
    "A hidden perk carried by Scorpion: any pet it hits in combat is knocked out, regardless of damage dealt.",
};
