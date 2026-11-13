import { Tag, type StaticPet } from "@/lib/types";

export const Bluejay: Readonly<StaticPet> = {
  name: "Bluejay",
  sprite: "/sap/Bluejay.png",
  tier: 5,
  baseAttack: 3,
  baseHealth: 3,
  isToken: false,
  tags: [Tag.Food],
  superTags: 0,
  abilities: new Map(),
  description: "TODO",
};
