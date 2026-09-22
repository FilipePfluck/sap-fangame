import type { FoodType } from "@/lib/types";

export const MeatBone: FoodType = {
  name: "Meat Bone",
  sprite: "/sap/meat-bone.webp",
  tier: 2,
  isPerk: true,
  isToken: false,
  effect: { attack: 3 }, // TODO: Implement perk effect
  description: "Give one pet the Meat Bone perk. Attack with +3 damage.",
};
