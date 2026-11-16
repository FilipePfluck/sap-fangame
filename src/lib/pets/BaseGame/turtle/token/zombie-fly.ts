import type { StaticPet } from "@/lib/types";

export const ZombieFly: Readonly<StaticPet> = {
  name: "Zombie Fly",
  id: 66,
  sprite: "/sap/Zombie_Fly.png",
  tier: 1,
  baseAttack: 4,
  baseHealth: 4,
  isToken: true,
  tags: [],
  superTags: 0,
  abilities: new Map(),
  description: "No ability.",
};
