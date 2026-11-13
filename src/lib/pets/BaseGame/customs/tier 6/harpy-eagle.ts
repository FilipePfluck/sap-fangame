import { Tag, type StaticPet } from "@/lib/types";

export const HarpyEagle: Readonly<StaticPet> = {
  name: "Harpy Eagle",
  sprite: "/sap/Harpy_Eagle.png",
  tier: 6,
  baseAttack: 6,
  baseHealth: 6,
  isToken: false,
  tags: [Tag.Summon],
  superTags: 0,
  abilities: new Map(),
  description: "TODO",
};
