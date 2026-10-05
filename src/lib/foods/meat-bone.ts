import type { FoodType } from "@/lib/types";
import { MeatBonePerk } from "@/lib/perks/meat-bone";

export const MeatBone: FoodType = {
  name: "Meat Bone",
  sprite: "/sap/meat-bone.webp",
  tier: 2,
  perk: MeatBonePerk,
  isToken: false,
  effect: {},
  description: "Give one pet the Meat Bone perk. Attack with +3 damage.",
};
