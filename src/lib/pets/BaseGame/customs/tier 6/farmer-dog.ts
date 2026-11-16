import { Tag, type StaticPet } from "@/lib/types";

export const FarmerDog: Readonly<StaticPet> = {
  name: "Farmer Dog",
  id: 127,
  sprite: "/sap/Farmer_Dog.png",
  tier: 6,
  baseAttack: 5,
  baseHealth: 6,
  isToken: false,
  tags: [Tag.Food],
  superTags: 0,
  abilities: new Map(),
  description: "TODO",
};
