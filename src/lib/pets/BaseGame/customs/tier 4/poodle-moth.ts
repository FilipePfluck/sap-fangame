import { Tag, type StaticPet } from "@/lib/types";

export const PoodleMoth: Readonly<StaticPet> = {
  name: "Poodle Moth",
  id: 108,
  sprite: "/sap/Poodle_Moth.png",
  tier: 4,
  baseAttack: 3,
  baseHealth: 5,
  isToken: false,
  tags: [Tag.LevelUp, Tag.Transform],
  superTags: 0,
  abilities: new Map(),
  description: "TODO",
};
