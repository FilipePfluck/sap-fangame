import { Tag, type StaticPet } from "@/lib/types";

export const Mink: Readonly<StaticPet> = {
  name: "Mink",
  sprite: "/sap/Mink.webp",
  tier: 2,
  baseAttack: 3,
  baseHealth: 3,
  isToken: false,
  tags: [Tag.Perk],
  superTags: 0,
  abilities: new Map(),
  description: "TODO",
};
