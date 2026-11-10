import type { StaticPet } from "@/lib/types";

export const Sloth: Readonly<StaticPet> = {
  name: "Sloth",
  id: 64,
  sprite: "/sap/sloth.webp",
  tier: 1,
  baseAttack: 1,
  baseHealth: 1,
  isToken: false,
  tags: [],
  superTags: 0,
  abilities: new Map(),
  description: "No ability.",
};
