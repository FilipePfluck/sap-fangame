import { Tag, type StaticPet } from "@/lib/types";

export const Marmoset: Readonly<StaticPet> = {
  name: "Marmoset",
  sprite: "/sap/Marmoset.png",
  tier: 1,
  baseAttack: 2,
  baseHealth: 3,
  isToken: false,
  tags: [Tag.Cycle],
  superTags: 0,
  abilities: new Map(),
  description: "TODO",
};
