import type { FoodType } from "@/lib/types";
import { MushroomPerk } from "@/lib/perks/mushroom";
import { givePerkDescription } from "@/lib/perks/give-perk-description";

export const Mushroom: FoodType = {
  name: "Mushroom",
  id: 17,
  sprite: "/sap/mushroom.webp",
  tier: 6,
  perk: MushroomPerk,
  isToken: false,
  effect: {},
  description: givePerkDescription(MushroomPerk),
};
