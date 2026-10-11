import type { StaticPet } from "@/lib/types";

export const Tiger: Readonly<StaticPet> = {
  name: "Tiger",
  sprite: "/sap/tiger.webp",
  tier: 6,
  baseAttack: 6,
  baseHealth: 4,
  isToken: false,
  ability: null,
  description: (level: number) => `The friend ahead repeats their ability in battle as if they were level ${level}.`,
};
