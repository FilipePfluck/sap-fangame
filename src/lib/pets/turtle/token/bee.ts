import type { PetType } from "@/lib/types";

export const Bee: PetType = {
  name: "Bee",
  sprite: "/sap/bee.webp",
  tier: 1,
  baseAttack: 1,
  baseHealth: 1,
  isToken: true,
  ability: null,
  description: "No special ability.",
};
