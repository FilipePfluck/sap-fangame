import type { StaticPet } from "@/lib/types";

export const CuckooChick: Readonly<StaticPet> = {
  name: "Cuckoo Chick",
  sprite: "/sap/Cuckoo_Chick.webp",
  tier: 1,
  baseAttack: 1,
  baseHealth: 1,
  isToken: true,
  tags: [],
  superTags: 0,
  abilities: new Map(),
  description: "TODO",
};
