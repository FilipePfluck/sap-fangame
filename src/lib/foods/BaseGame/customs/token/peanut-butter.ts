import type { FoodType } from "@/lib/types";
import { TOKEN_TIER } from "@/lib/game/rules";

export const PeanutButter: FoodType = {
  name: "Peanut Butter",
  sprite: "/sap/Peanut_Butter.webp",
  tier: TOKEN_TIER,
  isToken: true,
  effect: {},
  description: "TODO",
};
