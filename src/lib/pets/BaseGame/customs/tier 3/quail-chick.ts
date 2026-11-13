import { Tag, type StaticPet } from "@/lib/types";

export const QuailChick: Readonly<StaticPet> = {
  name: "Quail Chick",
  id: 94,
  sprite: "/sap/Quail_Chick.webp",
  tier: 3,
  baseAttack: 2,
  baseHealth: 4,
  isToken: false,
  tags: [Tag.Food, Tag.Transform],
  superTags: 0,
  abilities: new Map(),
  description: "TODO",
};
