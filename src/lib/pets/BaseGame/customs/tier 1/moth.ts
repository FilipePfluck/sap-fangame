import type { StaticPet } from "@/lib/types";

export const Moth: Readonly<StaticPet> = {
  name: "Moth",
  id: 70,
  sprite: "/sap/Moth.webp",
  tier: 1,
  baseAttack: 1,
  baseHealth: 3,
  isToken: false,
  tags: [],
  superTags: 0,
  abilities: new Map(),
  description: "TODO",
};
