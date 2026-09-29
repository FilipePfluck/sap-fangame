import { PetType } from "@/lib/types";

export const Chick: PetType = {
  name: "Chick",
  sprite: "/sap/Chick.webp",
  tier: 5,
  baseAttack: 1,
  baseHealth: 1,
  isToken: true,
  ability: null,
  description: "Token with no ability.",
};