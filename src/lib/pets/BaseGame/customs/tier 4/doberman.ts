import { Tag, type StaticPet } from "@/lib/types";

export const Doberman: Readonly<StaticPet> = {
  name: "Doberman",
  id: 100,
  sprite: "/sap/Doberman.png",
  tier: 4,
  baseAttack: 1,
  baseHealth: 4,
  isToken: false,
  tags: [Tag.Perk],
  superTags: 0,
  abilities: new Map(),
  description: "TODO",
};
