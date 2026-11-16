import { Tag, type StaticPet } from "@/lib/types";

export const Weevil: Readonly<StaticPet> = {
  name: "Weevil",
  id: 75,
  sprite: "/sap/Weevil.png",
  tier: 1,
  baseAttack: 2,
  baseHealth: 2,
  isToken: false,
  tags: [Tag.Food],
  superTags: 0,
  abilities: new Map(),
  description: "TODO",
};
