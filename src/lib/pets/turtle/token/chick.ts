import { StaticPet } from "@/lib/types";

export const Chick: Readonly<StaticPet> = {
  name: "Chick",
  sprite: "/sap/Chick.webp",
  tier: 5,
  baseAttack: 1,
  baseHealth: 1,
  isToken: true,
  abilities: new Map(),
  description: "No ability.",
};