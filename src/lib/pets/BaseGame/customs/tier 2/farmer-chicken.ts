import { Tag, type StaticPet } from "@/lib/types";

export const FarmerChicken: Readonly<StaticPet> = {
  name: "Farmer Chicken",
  sprite: "/sap/Farmer_Chicken.png",
  tier: 2,
  baseAttack: 2,
  baseHealth: 2,
  isToken: false,
  tags: [Tag.Food],
  superTags: 0,
  abilities: new Map(),
  description: "TODO",
};
