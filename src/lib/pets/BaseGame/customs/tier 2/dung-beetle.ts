import { Tag, type StaticPet } from "@/lib/types";

export const DungBeetle: Readonly<StaticPet> = {
  name: "Dung Beetle",
  id: 79,
  sprite: "/sap/Dung_Beetle.png",
  tier: 2,
  baseAttack: 2,
  baseHealth: 4,
  isToken: false,
  tags: [Tag.Food, Tag.Disruption],
  superTags: 0,
  abilities: new Map(),
  description: "TODO",
};
