import { TURTLE_PACK_PETS } from "@/lib/pets";
import { TURTLE_PACK_FOODS } from "@/lib/foods";

export const PET_SPRITES: Record<string, string> = Object.fromEntries(
  TURTLE_PACK_PETS.map((p) => [p.name, p.sprite])
);

export const FOOD_SPRITES: Record<string, string> = Object.fromEntries(
  TURTLE_PACK_FOODS.map((f) => [f.name, f.sprite])
);
