import { Tag, type StaticPet } from "@/lib/types";

export const FarmerPig: Readonly<StaticPet> = {
  name: "Farmer Pig",
  id: 91,
  sprite: "/sap/Farmer_Pig.webp",
  tier: 3,
  baseAttack: 3,
  baseHealth: 4,
  isToken: false,
  tags: [Tag.Food],
  superTags: 0,
  abilities: new Map(),
  description: "TODO",
};
