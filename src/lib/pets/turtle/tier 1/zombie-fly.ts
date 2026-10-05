import type { StaticPet } from "@/lib/types";

export const ZombieFly: Readonly<StaticPet> = {
  name: "Zombie Fly",
  sprite: "/sap/Zombie_Fly.png",
  tier: 1,
  baseAttack: 4,
  baseHealth: 4,
  isToken: true,
  ability: null,
  ignoresFriendFaintsFrom: ["Fly"],
  description: "No ability.",
};