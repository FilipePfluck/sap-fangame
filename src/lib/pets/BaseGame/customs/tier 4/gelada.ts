import { Tag, type StaticPet } from "@/lib/types";

export const Gelada: Readonly<StaticPet> = {
  name: "Gelada",
  id: 104,
  sprite: "/sap/Gelada.webp",
  tier: 4,
  baseAttack: 4,
  baseHealth: 5,
  isToken: false,
  tags: [Tag.Food, Tag.Transform],
  superTags: 0,
  abilities: new Map(),
  description: "TODO",
};
