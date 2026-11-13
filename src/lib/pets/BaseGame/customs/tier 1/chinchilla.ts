import { Tag, type StaticPet } from "@/lib/types";

export const Chinchilla: Readonly<StaticPet> = {
  name: "Chinchilla",
  id: 69,
  sprite: "/sap/Chinchilla.webp",
  tier: 1,
  baseAttack: 2,
  baseHealth: 3,
  isToken: false,
  tags: [Tag.Cycle, Tag.Gold],
  superTags: 0,
  abilities: new Map(),
  description: "TODO",
};
