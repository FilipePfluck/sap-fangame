import type { StaticPet } from "@/lib/types";

export const DirtyRat: Readonly<StaticPet> = {
  name: "Dirty Rat",
  id: 63,
  sprite: "/sap/Dirty_Rat.png",
  tier: 1,
  baseAttack: 1,
  baseHealth: 1,
  isToken: true,
  tags: [],
  superTags: 0,
  abilities: new Map(),
  description: "No ability.",
};
