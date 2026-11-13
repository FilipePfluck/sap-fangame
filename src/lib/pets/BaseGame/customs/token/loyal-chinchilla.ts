import type { StaticPet } from "@/lib/types";

export const LoyalChinchilla: Readonly<StaticPet> = {
  name: "Loyal Chinchilla",
  sprite: "/sap/Loyal_Chinchilla.png",
  tier: 1,
  baseAttack: 2,
  baseHealth: 2,
  isToken: true,
  tags: [],
  superTags: 0,
  abilities: new Map(),
  description: "TODO",
};
