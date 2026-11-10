import { Tag, type StaticPet } from "@/lib/types";

export const Moose: Readonly<StaticPet> = {
  name: "Moose",
  id: 116,
  sprite: "/sap/Moose.webp",
  tier: 5,
  baseAttack: 5,
  baseHealth: 6,
  isToken: false,
  tags: [Tag.Roll, Tag.Buff],
  superTags: 0,
  abilities: new Map(),
  description: "TODO",
};
