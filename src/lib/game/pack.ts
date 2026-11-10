import type { FoodType, StaticPet } from "@/lib/types";
import {
  AdultFlounder,
  Bee,
  Bus,
  Chick,
  Cow,
  Cricket,
  CUSTOMS_PETS,
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
  CUSTOMS_FOODS,
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

// A pre-built pack. The pack creation rules only apply to custom packs (Pack
// spec), so a static pack is never checked against them.
export type StaticPack = Readonly<{
  name: string;
  // Pet ID whose sprite stands for the pack.
  icon: number;
  pets: readonly StaticPet[];
  foods: readonly FoodType[];
  // The fangame's own pets and foods, shown by the viewer's "Custom exclusive" checkbox.
  customPets: readonly StaticPet[];
  customFoods: readonly FoodType[];
}>;

export const TURTLE_PACK: StaticPack = {
  name: "Turtle",
  icon: Turtle.id,
  pets: SHOP_PET_POOL,
  foods: SHOP_FOOD_POOL,
  customPets: CUSTOMS_PETS.filter((pet) => !pet.isToken),
  customFoods: CUSTOMS_FOODS.filter((food) => !food.isToken),
};

export const STATIC_PACKS: readonly StaticPack[] = [TURTLE_PACK];

type PackTierRow = Readonly<{
  tier: number;
  unlockTurn: number;
  pets: readonly StaticPet[];
  foods: readonly FoodType[];
}>;

export function getPackTierRows(pets: readonly StaticPet[], foods: readonly FoodType[]): readonly PackTierRow[] {
  return Array.from({ length: MAX_TIER }, (_, index) => {
    const tier = index + 1;
    return {
      tier,
      unlockTurn: getTierUnlockTurn(tier),
      pets: pets.filter((pet) => pet.tier === tier),
      foods: foods.filter((food) => food.tier === tier),
    };
  });
}

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
