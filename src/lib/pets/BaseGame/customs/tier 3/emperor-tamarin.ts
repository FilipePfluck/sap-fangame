import { Tag, type StaticPet } from "@/lib/types";

export const EmperorTamarin: Readonly<StaticPet> = {
  name: "Emperor Tamarin",
  id: 90,
  sprite: "/sap/Emperor_Tamarin.png",
  tier: 3,
  baseAttack: 3,
  baseHealth: 6,
  isToken: false,
  tags: [Tag.Buff],
  superTags: 0,
  abilities: new Map(),
  description: "TODO",
};
