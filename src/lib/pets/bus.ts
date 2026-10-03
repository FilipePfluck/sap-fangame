import type { PetType } from "@/lib/types";

export const Bus: PetType = {
  name: "Bus",
  sprite: "/sap/Bus.png",
  tier: 1,
  baseAttack: 5,
  baseHealth: 3,
  isToken: true,
  ability: null,
  description: "No ability.",
};