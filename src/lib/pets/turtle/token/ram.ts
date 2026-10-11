import { StaticPet } from "@/lib/types";

export const Ram: Readonly<StaticPet> = {
  name: "Ram",
  sprite: "/sap/Ram.png",
  tier: 3,
  baseAttack: 2,
  baseHealth: 2,
  isToken: true,
  abilities: new Map(),
  description: "No ability.",
};