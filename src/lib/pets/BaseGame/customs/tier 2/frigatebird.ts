import { Tag, type StaticPet } from "@/lib/types";

export const Frigatebird: Readonly<StaticPet> = {
  name: "Frigatebird",
  id: 81,
  sprite: "/sap/Frigatebird.webp",
  tier: 2,
  baseAttack: 2,
  baseHealth: 5,
  isToken: false,
  tags: [Tag.Ailment],
  superTags: 0,
  abilities: new Map(),
  description: "TODO",
};
