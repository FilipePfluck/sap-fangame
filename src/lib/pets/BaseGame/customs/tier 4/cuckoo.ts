import { Tag, type StaticPet } from "@/lib/types";

export const Cuckoo: Readonly<StaticPet> = {
  name: "Cuckoo",
  id: 102,
  sprite: "/sap/Cuckoo.png",
  tier: 4,
  baseAttack: 5,
  baseHealth: 4,
  isToken: false,
  tags: [Tag.Hurt],
  superTags: 0,
  abilities: new Map(),
  description: "TODO",
};
