import type { StaticPet } from "@/lib/types";

export const Quail: Readonly<StaticPet> = {
  name: "Quail",
  id: 137,
  sprite: "/sap/Quail.png",
  tier: 3,
  baseAttack: 2,
  baseHealth: 4,
  isToken: true,
  tags: [],
  superTags: 0,
  abilities: new Map(),
  description: "TODO",
};
