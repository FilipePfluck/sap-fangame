import { Tag, type StaticPet } from "@/lib/types";

export const Trout: Readonly<StaticPet> = {
  name: "Trout",
  sprite: "/sap/Trout.webp",
  tier: 4,
  baseAttack: 3,
  baseHealth: 3,
  isToken: false,
  tags: [Tag.Gold],
  superTags: 0,
  abilities: new Map(),
  description: "TODO",
};
