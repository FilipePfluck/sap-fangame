import type { StaticPet } from "@/lib/types";

export const SilkieChicken: Readonly<StaticPet> = {
  name: "Silkie Chicken",
  id: 97,
  sprite: "/sap/Silkie_Chicken.png",
  tier: 3,
  baseAttack: 2,
  baseHealth: 6,
  isToken: false,
  tags: [],
  superTags: 0,
  abilities: new Map(),
  description: "TODO",
};
