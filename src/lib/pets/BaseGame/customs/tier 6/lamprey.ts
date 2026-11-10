import { Tag, type StaticPet } from "@/lib/types";

export const Lamprey: Readonly<StaticPet> = {
  name: "Lamprey",
  id: 129,
  sprite: "/sap/Lamprey.webp",
  tier: 6,
  baseAttack: 3,
  baseHealth: 8,
  isToken: false,
  tags: [Tag.Hurt],
  superTags: 0,
  abilities: new Map(),
  description: "TODO",
};
