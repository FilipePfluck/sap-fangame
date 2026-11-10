import { Tag, type StaticPet } from "@/lib/types";

export const Dragonfly: Readonly<StaticPet> = {
  name: "Dragonfly",
  id: 113,
  sprite: "/sap/Dragonfly.png",
  tier: 5,
  baseAttack: 4,
  baseHealth: 2,
  isToken: false,
  tags: [Tag.Buff],
  superTags: 0,
  abilities: new Map(),
  description: "TODO",
};
