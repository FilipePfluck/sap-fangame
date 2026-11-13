import { Tag, type StaticPet } from "@/lib/types";

export const TarantulaHawk: Readonly<StaticPet> = {
  name: "Tarantula Hawk",
  sprite: "/sap/Tarantula_Hawk.png",
  tier: 5,
  baseAttack: 10,
  baseHealth: 2,
  isToken: false,
  tags: [Tag.Disruption],
  superTags: 0,
  abilities: new Map(),
  description: "TODO",
};
