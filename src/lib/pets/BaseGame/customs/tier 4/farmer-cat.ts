import { Tag, type StaticPet } from "@/lib/types";

export const FarmerCat: Readonly<StaticPet> = {
  name: "Farmer Cat",
  sprite: "/sap/Farmer_Cat.png",
  tier: 4,
  baseAttack: 4,
  baseHealth: 3,
  isToken: false,
  tags: [Tag.Food],
  superTags: 0,
  abilities: new Map(),
  description: "TODO",
};
