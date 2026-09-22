import type { FoodType } from "@/lib/types";

export const CannedFood: FoodType = {
  name: "Canned Food",
  sprite: "/sap/canned-food.webp",
  tier: 4,
  isPerk: false,
  isToken: false,
  effect: { attack: 1, health: 1 }, // TODO: Implement shop scaling
  description: "Give all current and future shop pets +1 attack and +1 health.",
};
