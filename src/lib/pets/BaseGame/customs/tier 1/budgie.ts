import { Tag, type StaticPet } from "@/lib/types";

export const Budgie: Readonly<StaticPet> = {
  name: "Budgie",
  sprite: "/sap/Budgie.png",
  tier: 1,
  baseAttack: 1,
  baseHealth: 1,
  isToken: false,
  tags: [Tag.Summon, Tag.Perk],
  superTags: 0,
  abilities: new Map(),
  description: "TODO",
};
