export { Apple } from "./turtle/apple";
export { BetterApple } from "./turtle/better-apple";
export { BestApple } from "./turtle/best-apple";
export { Milk } from "./turtle/milk";
export { BetterMilk } from "./turtle/better-milk";
export { BestMilk } from "./turtle/best-milk";
export { Honey } from "./turtle/honey";
export { BreadCrumbs } from "./turtle/bread-crumbs";
export { Pill } from "./turtle/pill";
export { Garlic } from "./turtle/garlic";
export { Bread } from "./turtle/bread";
export { Sushi } from "./turtle/sushi";
export { Melon } from "./turtle/melon";
export { Peanut } from "./turtle/peanut";
export { Coconut } from "./turtle/coconut";

import type { FoodType } from "@/lib/types";
import { Cupcake } from "@/lib/foods/turtle/cupcake";
import { CannedFood } from "@/lib/foods/turtle/canned-food";
import { Pear } from "@/lib/foods/turtle/pear";
import { SaladBowl } from "@/lib/foods/turtle/salad-bowl";
import { Chili } from "@/lib/foods/turtle/chili";
import { Chocolate } from "@/lib/foods/turtle/chocolate";
import { Steak } from "@/lib/foods/turtle/steak";
import { Mushroom } from "@/lib/foods/turtle/mushroom";
import { Pizza } from "@/lib/foods/turtle/pizza";
import { Cake } from "@/lib/foods/turtle/cake";
import { BreadCrumbs } from "@/lib/foods/turtle/bread-crumbs";
import { Apple } from "@/lib/foods/turtle/apple";
import { BetterApple } from "@/lib/foods/turtle/better-apple";
import { BestApple } from "@/lib/foods/turtle/best-apple";
import { Milk } from "@/lib/foods/turtle/milk";
import { BetterMilk } from "@/lib/foods/turtle/better-milk";
import { BestMilk } from "@/lib/foods/turtle/best-milk";
import { Honey } from "@/lib/foods/turtle/honey";
import { Pill } from "@/lib/foods/turtle/pill";
import { MeatBone } from "@/lib/foods/turtle/meat-bone";
import { Garlic } from "@/lib/foods/turtle/garlic";
import { Bread } from "@/lib/foods/turtle/bread";
import { Sushi } from "@/lib/foods/turtle/sushi";
import { Melon } from "@/lib/foods/turtle/melon";
import { Peanut } from "@/lib/foods/turtle/peanut";
import { Coconut } from "@/lib/foods/turtle/coconut";

export const TURTLE_PACK_FOODS: FoodType[] = [
  BreadCrumbs,
  Apple,
  BetterApple,
  BestApple,
  Milk,
  BetterMilk,
  BestMilk,
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
  Coconut,
];

export const FOOD_REGISTRY: Record<string, FoodType> = Object.fromEntries(
  TURTLE_PACK_FOODS.map((f) => [f.name, f])
);

export const SHOP_FOOD_POOL: FoodType[] = TURTLE_PACK_FOODS.filter(
  (f) => !f.isToken
);
