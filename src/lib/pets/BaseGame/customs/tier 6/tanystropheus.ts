import { Tag, type StaticPet } from "@/lib/types";

export const Tanystropheus: Readonly<StaticPet> = {
  name: "Tanystropheus",
  id: 131,
  sprite: "/sap/Tanystropheus.png",
  tier: 6,
  baseAttack: 6,
  baseHealth: 6,
  isToken: false,
  tags: [Tag.Disruption],
  superTags: 0,
  abilities: new Map(),
  description: "TODO",
};
