import type { FoodType } from "@/lib/types";
import { MeatBonePerk } from "@/lib/perks/meat-bone";
import { givePerkDescription } from "@/lib/perks/give-perk-description";

export const MeatBone: FoodType = {
  name: "Meat Bone",
  sprite: "/sap/meat-bone.webp",
  tier: 2,
  perk: MeatBonePerk,
  isToken: false,
  effect: {},
  description: givePerkDescription(MeatBonePerk),
};
