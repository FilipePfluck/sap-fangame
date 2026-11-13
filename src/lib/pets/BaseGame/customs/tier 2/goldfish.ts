import { Tag, type StaticPet } from "@/lib/types";

export const Goldfish: Readonly<StaticPet> = {
  name: "Goldfish",
  id: 76,
  sprite: "/sap/Goldfish.png",
  tier: 2,
  baseAttack: 1,
  baseHealth: 1,
  isToken: false,
  tags: [Tag.Gold],
  superTags: 0,
  abilities: new Map(),
  description: "TODO",
};
