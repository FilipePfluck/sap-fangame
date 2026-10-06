export { Apple } from "./apple";
export { Honey } from "./honey";
export { BreadCrumbs } from "./bread-crumbs";
export { Pill } from "./pill";
export { Garlic } from "./garlic";
export { Bread } from "./bread";
export { Sushi } from "./sushi";
export { Melon } from "./melon";
export { Peanut } from "./peanut";

import type { FoodType } from "@/lib/types";
import { Cupcake } from "@/lib/foods/cupcake";
import { CannedFood } from "@/lib/foods/canned-food";
import { Pear } from "@/lib/foods/pear";
import { SaladBowl } from "@/lib/foods/salad-bowl";
import { Chili } from "@/lib/foods/chili";
import { Chocolate } from "@/lib/foods/chocolate";
import { Steak } from "@/lib/foods/steak";
import { Mushroom } from "@/lib/foods/mushroom";
import { Pizza } from "@/lib/foods/pizza";
import { Cake } from "@/lib/foods/cake";
import { BreadCrumbs } from "@/lib/foods/bread-crumbs";
import { Apple } from "@/lib/foods/apple";
import { Honey } from "@/lib/foods/honey";
import { Pill } from "@/lib/foods/pill";
import { MeatBone } from "@/lib/foods/meat-bone";
import { Garlic } from "@/lib/foods/garlic";
import { Bread } from "@/lib/foods/bread";
import { Sushi } from "@/lib/foods/sushi";
import { Melon } from "@/lib/foods/melon";
import { Peanut } from "@/lib/foods/peanut";

export const TURTLE_PACK_FOODS: FoodType[] = [
  BreadCrumbs,
  Apple,
  Honey,
  Pill,
  MeatBone,
  Cupcake,
  Garlic,
  SaladBowl,
  Cake,
  Bread,
  CannedFood,
  Pear,
  Sushi,
  Chili,
  Chocolate,
  Melon,
  Steak,
  Mushroom,
  Pizza,
  Peanut,
];

export const FOOD_REGISTRY: Record<string, FoodType> = Object.fromEntries(
  TURTLE_PACK_FOODS.map((f) => [f.name, f])
);

export const SHOP_FOOD_POOL: FoodType[] = TURTLE_PACK_FOODS.filter(
  (f) => !f.isToken
);
