import type { StaticPet } from "@/lib/types";

export const Wasp: Readonly<StaticPet> = {
  name: "Wasp",
  sprite: "/sap/Wasp.png",
  tier: 3,
  baseAttack: 3,
  baseHealth: 3,
  isToken: false,
  tags: [],
  superTags: 0,
  abilities: new Map(),
  description: "TODO",
};
