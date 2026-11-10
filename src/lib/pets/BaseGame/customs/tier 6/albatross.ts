import { Tag, type StaticPet } from "@/lib/types";

export const Albatross: Readonly<StaticPet> = {
  name: "Albatross",
  id: 122,
  sprite: "/sap/Albatross.webp",
  tier: 6,
  baseAttack: 5,
  baseHealth: 4,
  isToken: false,
  tags: [Tag.Disruption],
  superTags: 0,
  abilities: new Map(),
  description: "TODO",
};
