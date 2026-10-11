import type { StaticPet } from "@/lib/types";

export const ZombieCricket: Readonly<StaticPet> = {
  name: "Zombie Cricket",
  sprite: "/sap/zombie-cricket.webp",
  tier: 1,
  baseAttack: 1,
  baseHealth: 1,
  isToken: true,
  ability: null,
  description: "No ability.",
};
