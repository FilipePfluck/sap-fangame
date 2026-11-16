import { Tag, type StaticPet } from "@/lib/types";

export const FarmerCrow: Readonly<StaticPet> = {
  name: "Farmer Crow",
  id: 114,
  sprite: "/sap/Farmer_Crow.png",
  tier: 5,
  baseAttack: 6,
  baseHealth: 3,
  isToken: false,
  tags: [Tag.Food],
  superTags: 0,
  abilities: new Map(),
  description: "TODO",
};
