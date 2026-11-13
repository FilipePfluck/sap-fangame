import { StaticPet } from "@/lib/types";

export const Ram: Readonly<StaticPet> = {
  name: "Ram",
  id: 67,
  sprite: "/sap/Ram.png",
  tier: 3,
  baseAttack: 2,
  baseHealth: 2,
  isToken: true,
  tags: [],
  superTags: 0,
  abilities: new Map(),
  description: "No ability.",
};