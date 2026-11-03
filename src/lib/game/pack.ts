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
  Chili,
  Coconut,
  Cupcake,
  Honey,
  Melon,
  Milk,
  Peanut,
  SHOP_FOOD_POOL,
  getFoodTooltipText,
} from "@/lib/foods";
import { MAX_TIER } from "@/lib/game/rules";
import { getTierUnlockTurn } from "@/lib/game/shop";

export type TooltipEntry = StaticPet | FoodType;

type PackTierRow = Readonly<{
  tier: number;
  unlockTurn: number;
  pets: readonly StaticPet[];
  foods: readonly FoodType[];
}>;

export const PACK_TIER_ROWS: readonly PackTierRow[] = Array.from({ length: MAX_TIER }, (_, index) => {
  const tier = index + 1;
  return {
    tier,
    unlockTurn: getTierUnlockTurn(tier),
    pets: SHOP_PET_POOL.filter((pet) => pet.tier === tier),
    foods: SHOP_FOOD_POOL.filter((food) => food.tier === tier),
  };
});

// The tokens and foods each pet or food names, shown as extra tooltip pages.
const TOOLTIP_LINKS = new Map<TooltipEntry, readonly TooltipEntry[]>([
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

function getEntryPage(entry: TooltipEntry): string {
  return "abilities" in entry ? getAllLevelsTooltipText(entry) : getFoodTooltipText(entry);
}

export function getTooltipPages(entry: TooltipEntry): readonly string[] {
  return [entry, ...(TOOLTIP_LINKS.get(entry) ?? [])].map(getEntryPage);
}
