import type { StaticPet } from "@/lib/types";

export const Sloth: Readonly<StaticPet> = {
  name: "Sloth",
  sprite: "/sap/sloth.webp",
  tier: 1,
  baseAttack: 1,
  baseHealth: 1,
  isToken: false,
  ability: null,
  description: "No ability.",
};
