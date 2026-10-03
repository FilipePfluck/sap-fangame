import type { PetType } from "@/lib/types";

export const ZombieFly: PetType = {
  name: "Zombie Fly",
  sprite: "/sap/Zombie_Fly.png",
  tier: 1,
  baseAttack: 4,
  baseHealth: 4,
  isToken: true,
  ability: null,
  ignoreFriendFaints: true,
  description: "No ability.",
};