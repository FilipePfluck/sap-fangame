import type { StaticPet } from "@/lib/types";

export const Bee: StaticPet = {
  name: "Bee",
  sprite: "/sap/bee.webp",
  tier: 1,
  baseAttack: 1,
  baseHealth: 1,
  isToken: true,
  ability: null,
  description: "No special ability.",
};
