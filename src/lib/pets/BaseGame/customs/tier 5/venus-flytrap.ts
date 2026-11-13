import { Tag, type StaticPet } from "@/lib/types";

export const VenusFlytrap: Readonly<StaticPet> = {
  name: "Venus Flytrap",
  id: 119,
  sprite: "/sap/Venus_Flytrap.webp",
  tier: 5,
  baseAttack: 2,
  baseHealth: 7,
  isToken: false,
  tags: [Tag.Cycle, Tag.LevelUp],
  superTags: 0,
  abilities: new Map(),
  description: "TODO",
};
