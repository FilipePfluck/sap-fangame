import { Tag, type StaticPet } from "@/lib/types";

export const Parrot: Readonly<StaticPet> = {
  name: "Parrot",
  sprite: "/sap/Parrot.webp",
  tier: 4,
  baseAttack: 4,
  baseHealth: 2,
  isToken: false,
  tags: [Tag.Disruption],
  superTags: 2,
  abilities: new Map(),
  description: "TODO",
};
