import type { StaticPet } from "@/lib/types";
import { Tag } from "@/lib/types";

export const Tiger: Readonly<StaticPet> = {
  name: "Tiger",
  id: 59,
  sprite: "/sap/tiger.webp",
  tier: 6,
  baseAttack: 6,
  baseHealth: 4,
  isToken: false,
  tags: [Tag.Disruption],
  superTags: 2,
  abilities: new Map(),
  description: (level: number) => `The friend ahead repeats their ability in battle as if they were level ${level}.`,
};
