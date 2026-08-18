export { Apple } from "./apple";
export { Honey } from "./honey";
export { BreadCrumbs } from "./bread-crumbs";

import { Apple } from "./apple";
import { Honey } from "./honey";
import { BreadCrumbs } from "./bread-crumbs";
import type { FoodType } from "@/lib/types";

export const TURTLE_PACK_FOODS: FoodType[] = [Apple, Honey, BreadCrumbs];

export const FOOD_REGISTRY: Record<string, FoodType> = Object.fromEntries(
  TURTLE_PACK_FOODS.map((f) => [f.name, f])
);

export const SHOP_FOOD_POOL: FoodType[] = TURTLE_PACK_FOODS.filter((f) => !f.isToken);
