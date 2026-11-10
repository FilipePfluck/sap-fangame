import { Tag, type StaticPet } from "@/lib/types";

export const Pony: Readonly<StaticPet> = {
  name: "Pony",
  id: 92,
  sprite: "/sap/Pony.png",
  tier: 3,
  baseAttack: 4,
  baseHealth: 4,
  isToken: false,
  tags: [Tag.Food],
  superTags: 0,
  abilities: new Map(),
  description: "TODO",
};
