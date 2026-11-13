import { Tag, type StaticPet } from "@/lib/types";

export const Vervet: Readonly<StaticPet> = {
  name: "Vervet",
  id: 83,
  sprite: "/sap/Vervet.png",
  tier: 2,
  baseAttack: 1,
  baseHealth: 3,
  isToken: false,
  tags: [Tag.Summon, Tag.Toy],
  superTags: 0,
  abilities: new Map(),
  description: "TODO",
};
