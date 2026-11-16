import { ALL_PETS } from "@/lib/pets";
import { ALL_FOODS } from "@/lib/foods";

export const PET_SPRITES: Record<string, string> = Object.fromEntries(
  ALL_PETS.map((p) => [p.name, p.sprite])
);

export const FOOD_SPRITES: Record<string, string> = Object.fromEntries(
  ALL_FOODS.map((f) => [f.name, f.sprite])
);
