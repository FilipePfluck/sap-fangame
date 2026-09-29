import { PetType } from "@/lib/types";

export const Ram: PetType = {
  name: "Ram",
  sprite: "/sap/Ram.png",
  tier: 3,
  baseAttack: 2,
  baseHealth: 2,
  isToken: true,
  ability: null,
  description: "Token with no ability.",
};