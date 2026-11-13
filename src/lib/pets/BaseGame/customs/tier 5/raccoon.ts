import { Tag, type StaticPet } from "@/lib/types";

export const Raccoon: Readonly<StaticPet> = {
  name: "Raccoon",
  sprite: "/sap/Raccoon.png",
  tier: 5,
  baseAttack: 4,
  baseHealth: 5,
  isToken: false,
  tags: [Tag.Perk],
  superTags: 0,
  abilities: new Map(),
  description: "TODO",
};
