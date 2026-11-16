import { StaticPet } from "@/lib/types";

export const Chick: Readonly<StaticPet> = {
  name: "Chick",
  id: 68,
  sprite: "/sap/Chick.webp",
  tier: 5,
  baseAttack: 1,
  baseHealth: 1,
  isToken: true,
  tags: [],
  superTags: 0,
  abilities: new Map(),
  description: "No ability.",
};