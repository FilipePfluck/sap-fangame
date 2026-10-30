import type { FoodType, StaticPet } from "@/lib/types";
import {
  AdultFlounder,
  Bee,
  Bus,
  Chick,
  Cow,
  Cricket,
  Deer,
  DirtyRat,
  Flounder,
  Fly,
  Gorilla,
  Jerboa,
  Ox,
  Pigeon,
  Ram,
  Rat,
  Rooster,
  SHOP_PET_POOL,
  Scorpion,
  Sheep,
  SugarGlider,
  Turtle,
  Worm,
  ZombieCricket,
  ZombieFly,
  getAllLevelsTooltipText,
} from "@/lib/pets";
import {
  Apple,
  BestApple,
  BestMilk,
  BetterApple,
  BetterMilk,
  BreadCrumbs,
  Coconut,
  Honey,
  Melon,
  Milk,
  Peanut,
  SHOP_FOOD_POOL,
} from "@/lib/foods";
import { Chili } from "@/lib/foods/chili";
import { Cupcake } from "@/lib/foods/cupcake";
import { MAX_TIER } from "@/lib/game/rules";
import { getTierUnlockTurn } from "@/lib/game/shop";

export type PackTierRow = Readonly<{
  tier: number;
  unlockTurn: number;
  pets: readonly StaticPet[];
  foods: readonly FoodType[];
}>;

export function getPackTierRows(): readonly PackTierRow[] {
  return Array.from({ length: MAX_TIER }, (_, index) => {
    const tier = index + 1;
    return {
      tier,
      unlockTurn: getTierUnlockTurn(tier),
      pets: SHOP_PET_POOL.filter((pet) => pet.tier === tier),
      foods: SHOP_FOOD_POOL.filter((food) => food.tier === tier),
    };
  });
}

// The tokens and foods each pet or food names, shown as extra tooltip pages.
const TOOLTIP_LINKS: ReadonlyMap<StaticPet | FoodType, readonly (StaticPet | FoodType)[]> = new Map<
  StaticPet | FoodType,
  readonly (StaticPet | FoodType)[]
>([
  [Pigeon, [BreadCrumbs]],
  [Cricket, [ZombieCricket]],
  [Worm, [Apple, BetterApple, BestApple]],
  [Rat, [DirtyRat]],
  [SugarGlider, [Cupcake]],
  [Sheep, [Ram]],
  [Turtle, [Melon]],
  [Ox, [Melon]],
  [Jerboa, [Apple]],
  [Scorpion, [Peanut]],
  [Rooster, [Chick]],
  [Cow, [Milk, BetterMilk, BestMilk]],
  [Flounder, [AdultFlounder]],
  [Deer, [Bus, Chili]],
  [Gorilla, [Coconut]],
  [Fly, [ZombieFly]],
  [Honey, [Bee]],
]);

function getLinkedPage(entry: StaticPet | FoodType): string {
  const text = "abilities" in entry ? getAllLevelsTooltipText(entry) : entry.description;
  return `${entry.name}\n${text}`;
}

function getLinkedPages(entry: StaticPet | FoodType): readonly string[] {
  return (TOOLTIP_LINKS.get(entry) ?? []).map(getLinkedPage);
}

export function getPetTooltipPages(pet: StaticPet): readonly string[] {
  return [getAllLevelsTooltipText(pet), ...getLinkedPages(pet)];
}

export function getFoodTooltipPages(food: FoodType): readonly string[] {
  return [food.description, ...getLinkedPages(food)];
}
