import { Tag, type StaticPet } from "@/lib/types";

export const Toucan: Readonly<StaticPet> = {
  name: "Toucan",
  sprite: "/sap/Toucan.webp",
  tier: 3,
  baseAttack: 4,
  baseHealth: 3,
  isToken: false,
  tags: [Tag.Perk],
  superTags: 0,
  abilities: new Map(),
  description: "TODO",
};
