import { Tag, type StaticPet } from "@/lib/types";

export const Locust: Readonly<StaticPet> = {
  name: "Locust",
  sprite: "/sap/Locust.png",
  tier: 4,
  baseAttack: 3,
  baseHealth: 3,
  isToken: false,
  tags: [Tag.Summon, Tag.Food],
  superTags: 0,
  abilities: new Map(),
  description: "TODO",
};
