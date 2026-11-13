import { Tag, type StaticPet } from "@/lib/types";

export const Bear: Readonly<StaticPet> = {
  name: "Bear",
  sprite: "/sap/Bear.png",
  tier: 3,
  baseAttack: 3,
  baseHealth: 5,
  isToken: false,
  tags: [Tag.Perk, Tag.Honey],
  superTags: 0,
  abilities: new Map(),
  description: "TODO",
};
