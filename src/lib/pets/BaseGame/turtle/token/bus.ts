import type { StaticPet } from "@/lib/types";

export const Bus: Readonly<StaticPet> = {
  name: "Bus",
  sprite: "/sap/Bus.png",
  tier: 1,
  baseAttack: 5,
  baseHealth: 3,
  isToken: true,
  tags: [],
  superTags: 0,
  abilities: new Map(),
  description: "No ability.",
};
