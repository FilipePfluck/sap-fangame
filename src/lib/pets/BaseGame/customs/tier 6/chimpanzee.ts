import { Tag, type StaticPet } from "@/lib/types";

export const Chimpanzee: Readonly<StaticPet> = {
  name: "Chimpanzee",
  sprite: "/sap/Chimpanzee.webp",
  tier: 6,
  baseAttack: 3,
  baseHealth: 5,
  isToken: false,
  tags: [Tag.Food],
  superTags: 0,
  abilities: new Map(),
  description: "TODO",
};
