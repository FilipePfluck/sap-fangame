import { Tag, type StaticPet } from "@/lib/types";

export const SarcasticFringehead: Readonly<StaticPet> = {
  name: "Sarcastic Fringehead",
  sprite: "/sap/Sarcastic_Fringehead.webp",
  tier: 3,
  baseAttack: 4,
  baseHealth: 7,
  isToken: false,
  tags: [Tag.Hurt],
  superTags: 0,
  abilities: new Map(),
  description: "TODO",
};
