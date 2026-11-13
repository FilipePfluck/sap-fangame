import { Tag, type StaticPet } from "@/lib/types";

export const Tapir: Readonly<StaticPet> = {
  name: "Tapir",
  id: 132,
  sprite: "/sap/Tapir.png",
  tier: 6,
  baseAttack: 4,
  baseHealth: 3,
  isToken: false,
  tags: [Tag.Cycle],
  superTags: 0,
  abilities: new Map(),
  description: "TODO",
};
