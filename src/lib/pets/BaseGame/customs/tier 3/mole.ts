import { Tag, type StaticPet } from "@/lib/types";

export const Mole: Readonly<StaticPet> = {
  name: "Mole",
  sprite: "/sap/Mole.png",
  tier: 3,
  baseAttack: 2,
  baseHealth: 3,
  isToken: false,
  tags: [Tag.Perk],
  superTags: 0,
  abilities: new Map(),
  description: "TODO",
};
