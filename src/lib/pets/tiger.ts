import type { PetType } from "@/lib/types";

export const Tiger: PetType = {
  name: "Tiger",
  sprite: "/sap/tiger.webp",
  tier: 6,
  baseAttack: 6,
  baseHealth: 4,
  isToken: false,
  ability: null,
  description: "The friend ahead repeats their ability as if they were level 1.",
};
