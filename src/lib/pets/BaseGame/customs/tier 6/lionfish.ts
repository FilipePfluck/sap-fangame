import { Tag, type StaticPet } from "@/lib/types";

export const Lionfish: Readonly<StaticPet> = {
  name: "Lionfish",
  sprite: "/sap/Lionfish.webp",
  tier: 6,
  baseAttack: 10,
  baseHealth: 4,
  isToken: false,
  tags: [Tag.Disruption],
  superTags: 0,
  abilities: new Map(),
  description: "TODO",
};
