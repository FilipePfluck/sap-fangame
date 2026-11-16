import type { StaticPet } from "@/lib/types";

export const Aardvark: Readonly<StaticPet> = {
  name: "Aardvark",
  id: 87,
  sprite: "/sap/Aardvark.png",
  tier: 3,
  baseAttack: 2,
  baseHealth: 3,
  isToken: false,
  tags: [],
  superTags: 0,
  abilities: new Map(),
  description: "TODO",
};
