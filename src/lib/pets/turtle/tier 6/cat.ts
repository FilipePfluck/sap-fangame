import type { StaticPet } from "@/lib/types";

const TIMES_BY_LEVEL = ["two", "three", "four"];

export const Cat: Readonly<StaticPet> = {
  name: "Cat",
  sprite: "/sap/Cat.webp",
  tier: 6,
  baseAttack: 4,
  baseHealth: 5,
  isToken: false,
  abilities: new Map(),
  // Applied when food is bought; see lib/game/food.
  foodStatMultiplier: { usesPerTurn: 2 },
  description: (level: number) =>
    `Shop food gives ${TIMES_BY_LEVEL[level - 1]} times attack and health. Works 2 times per turn.`,
};
