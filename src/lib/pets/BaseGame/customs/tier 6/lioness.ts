import { Tag, type StaticPet } from "@/lib/types";

export const Lioness: Readonly<StaticPet> = {
  name: "Lioness",
  id: 130,
  sprite: "/sap/Lioness.png",
  tier: 6,
  baseAttack: 7,
  baseHealth: 7,
  isToken: false,
  tags: [Tag.Buff],
  superTags: 0,
  abilities: new Map(),
  description: "TODO",
};
