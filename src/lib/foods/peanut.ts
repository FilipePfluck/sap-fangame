import type { FoodType } from "@/lib/types";

export const Peanut: FoodType = {
  name: "Peanut",
  sprite: "/sap/peanut.webp",
  tier: 5,
  isPerk: true,
  isToken: true,
  effect: {},
  description:
    "A hidden perk carried by Scorpion: any pet it hits in combat is knocked out, regardless of damage dealt.",
};
