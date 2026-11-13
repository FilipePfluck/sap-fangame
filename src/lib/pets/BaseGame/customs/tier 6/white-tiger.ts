import { Tag, type StaticPet } from "@/lib/types";

export const WhiteTiger: Readonly<StaticPet> = {
  name: "White Tiger",
  sprite: "/sap/White_Tiger.png",
  tier: 6,
  baseAttack: 4,
  baseHealth: 3,
  isToken: false,
  tags: [Tag.LevelUp],
  superTags: 0,
  abilities: new Map(),
  description: "TODO",
};
