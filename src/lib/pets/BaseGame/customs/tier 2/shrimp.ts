import { Tag, type StaticPet } from "@/lib/types";

export const Shrimp: Readonly<StaticPet> = {
  name: "Shrimp",
  id: 77,
  sprite: "/sap/Shrimp.webp",
  tier: 2,
  baseAttack: 2,
  baseHealth: 2,
  isToken: false,
  tags: [Tag.Cycle],
  superTags: 0,
  abilities: new Map(),
  description: "TODO",
};
