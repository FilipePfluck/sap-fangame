import type { StaticPet } from "@/lib/types";

export const Porcupine: Readonly<StaticPet> = {
  name: "Porcupine",
  id: 93,
  sprite: "/sap/Porcupine.png",
  tier: 3,
  baseAttack: 2,
  baseHealth: 6,
  isToken: false,
  tags: [],
  superTags: 0,
  abilities: new Map(),
  description: "TODO",
};
