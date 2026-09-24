import type { FoodType } from "@/lib/types";
import { MushroomPerk } from "@/lib/perks/mushroom";

export const Mushroom: FoodType = {
  name: "Mushroom",
  sprite: "/sap/mushroom.webp",
  tier: 6,
  perk: MushroomPerk,
  isToken: false,
  effect: {},
  description: "Give one pet the Mushroom perk. Faint -> Come back as a 1/1.",
};
