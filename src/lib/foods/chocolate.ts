import type { FoodType } from "@/lib/types";

export const Chocolate: FoodType = {
  name: "Chocolate",
  sprite: "/sap/chocolate.webp",
  tier: 5,
  isToken: false,
  effect: {},
  experience: 1,
  maxTargetXp: 5,
  description:
    "Give one pet +1 experience.\n\nGiving any exp will also give +1/+1 respective to the amount of exp gained (e.g. +2 exp at once gives +2/+2).\n\nPets start at 0 xp and reach lvl 2 at 2 xp and lvl 3 at 5 xp. Then they can't gain any more xp and can't be targeted by Chocolate. But if an ability gives them xp, they will still get the 1/1.",
};
