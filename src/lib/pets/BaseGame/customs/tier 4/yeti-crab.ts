import { Tag, type StaticPet } from "@/lib/types";

export const YetiCrab: Readonly<StaticPet> = {
  name: "Yeti Crab",
  sprite: "/sap/Yeti_Crab.png",
  tier: 4,
  baseAttack: 3,
  baseHealth: 5,
  isToken: false,
  tags: [Tag.Perk],
  superTags: 0,
  abilities: new Map(),
  description: "TODO",
};
