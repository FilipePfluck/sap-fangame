import { Tag, type StaticPet } from "@/lib/types";

export const EagleOwl: Readonly<StaticPet> = {
  name: "Eagle Owl",
  id: 126,
  sprite: "/sap/Eagle_Owl.png",
  tier: 6,
  baseAttack: 8,
  baseHealth: 3,
  isToken: false,
  tags: [Tag.Buff],
  superTags: 0,
  abilities: new Map(),
  description: "TODO",
};
