export { Apple } from "./apple";
export { Honey } from "./honey";
export { BreadCrumbs } from "./bread-crumbs";
export { Pill } from "./pill";
export { Garlic } from "./garlic";
export { Bread } from "./bread";
export { Sushi } from "./sushi";
export { Melon } from "./melon";
export { Peanut } from "./peanut";

import { Apple } from "./apple";
import { Honey } from "./honey";
import { BreadCrumbs } from "./bread-crumbs";
import { Pill } from "./pill";
import { Garlic } from "./garlic";
import { Bread } from "./bread";
import { Sushi } from "./sushi";
import { Melon } from "./melon";
import { Peanut } from "./peanut";
import type { FoodType } from "@/lib/types";

export const TURTLE_PACK_FOODS: FoodType[] = [
  Apple,
  Honey,
  BreadCrumbs,
  Pill,
  Garlic,
  Bread,
  Sushi,
  Melon,
  Peanut,
];

export const FOOD_REGISTRY: Record<string, FoodType> = Object.fromEntries(
  TURTLE_PACK_FOODS.map((f) => [f.name, f])
);

export const SHOP_FOOD_POOL: FoodType[] = TURTLE_PACK_FOODS.filter((f) => !f.isToken);
