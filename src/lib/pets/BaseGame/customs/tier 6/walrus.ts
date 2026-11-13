import { Tag, type StaticPet } from "@/lib/types";

export const Walrus: Readonly<StaticPet> = {
  name: "Walrus",
  sprite: "/sap/Walrus.webp",
  tier: 6,
  baseAttack: 7,
  baseHealth: 5,
  isToken: false,
  tags: [Tag.Perk],
  superTags: 0,
  abilities: new Map(),
  description: "TODO",
};
