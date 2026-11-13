import { Tag, type StaticPet } from "@/lib/types";

export const Lynx: Readonly<StaticPet> = {
  name: "Lynx",
  sprite: "/sap/Lynx.webp",
  tier: 4,
  baseAttack: 5,
  baseHealth: 3,
  isToken: false,
  tags: [Tag.LevelUp, Tag.Disruption],
  superTags: 0,
  abilities: new Map(),
  description: "TODO",
};
