import { Tag, type StaticPet } from "@/lib/types";

export const Wombat: Readonly<StaticPet> = {
  name: "Wombat",
  sprite: "/sap/Wombat.png",
  tier: 2,
  baseAttack: 3,
  baseHealth: 3,
  isToken: false,
  tags: [Tag.Transform],
  superTags: 0,
  abilities: new Map(),
  description: "TODO",
};
