import { Tag, type StaticPet } from "@/lib/types";

export const FarmerMouse: Readonly<StaticPet> = {
  name: "Farmer Mouse",
  id: 73,
  sprite: "/sap/Farmer_Mouse.png",
  tier: 1,
  baseAttack: 2,
  baseHealth: 3,
  isToken: false,
  tags: [Tag.Food],
  superTags: 0,
  abilities: new Map(),
  description: "TODO",
};
