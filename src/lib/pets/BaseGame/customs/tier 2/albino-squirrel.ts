import { Tag, type StaticPet } from "@/lib/types";

export const AlbinoSquirrel: Readonly<StaticPet> = {
  name: "Albino Squirrel",
  sprite: "/sap/Albino_Squirrel.png",
  tier: 2,
  baseAttack: 3,
  baseHealth: 2,
  isToken: false,
  tags: [Tag.Food],
  superTags: 0,
  abilities: new Map(),
  description: "TODO",
};
