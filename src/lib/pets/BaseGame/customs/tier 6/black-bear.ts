import { Tag, type StaticPet } from "@/lib/types";

export const BlackBear: Readonly<StaticPet> = {
  name: "Black Bear",
  sprite: "/sap/Black_Bear.png",
  tier: 6,
  baseAttack: 5,
  baseHealth: 6,
  isToken: false,
  tags: [Tag.Food, Tag.Disruption],
  superTags: 0,
  abilities: new Map(),
  description: "TODO",
};
