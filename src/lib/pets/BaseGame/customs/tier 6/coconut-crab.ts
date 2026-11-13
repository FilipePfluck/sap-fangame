import { Tag, type StaticPet } from "@/lib/types";

export const CoconutCrab: Readonly<StaticPet> = {
  name: "Coconut Crab",
  sprite: "/sap/Coconut_Crab.png",
  tier: 6,
  baseAttack: 4,
  baseHealth: 8,
  isToken: false,
  tags: [Tag.Food],
  superTags: 0,
  abilities: new Map(),
  description: "TODO",
};
