import type { FoodType, PetData, StaticPet, Tag } from "@/lib/types";
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
  PET_BY_ID,
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
  FOOD_BY_ID,
  Honey,
  Melon,
  Milk,
  Peanut,
  SHOP_FOOD_POOL,
  getFoodTooltipText,
} from "@/lib/foods";
import {
  FOODS_PER_TIER,
  MAX_SAME_TAG_PER_TIER,
  MAX_SUPER_TAGS_PER_PACK,
  MAX_TIER,
  PETS_PER_TIER,
  RESERVED_PACK_NAMES,
} from "@/lib/game/rules";
import { toPetData } from "@/lib/game/pet";

export type TooltipEntry = StaticPet | FoodType;

// One shop tier of a pack. `PackData.tier[0]` is tier 1.
export type PackTier = Readonly<{
  pets: readonly PetData[];
  foods: readonly FoodType[];
}>;

// Tags spec. Never saved: Pack.tagOverview works it out from the pets' tags.
export type TagOverview = Readonly<{
  // Super tags across the whole pack.
  superTags: number;
  // How many pets in each tier have each archetype. Index 0 is tier 1.
  tierBreakdown: readonly Readonly<Partial<Record<Tag, number>>>[];
}>;

// Pack spec. `foods` is FoodType where the spec writes ShopFood, which is the
// in-shop item and holds no food definition.
export type PackData = Readonly<{
  name: string;
  // Pet ID whose sprite stands for the pack.
  icon: number;
  tier: readonly PackTier[];
  isValid: boolean;
  tagOverview: TagOverview;
}>;

// How a pack is saved and shared: pets and foods by ID (Pack spec).
export type SerializedPack = Readonly<{
  name: string;
  icon: number;
  pets: readonly number[];
  foods: readonly number[];
  isValid: boolean;
}>;

// Splits pets and foods into the shop tiers. Throws for anything outside them.
function groupByTier(pets: readonly StaticPet[], foods: readonly FoodType[]): readonly PackTier[] {
  const outsideShopTiers = [...pets, ...foods].find((entry) => entry.tier < 1 || entry.tier > MAX_TIER);
  if (outsideShopTiers) throw new Error(`${outsideShopTiers.name} is not in a shop tier`);
  return Array.from({ length: MAX_TIER }, (_, index) => ({
    pets: pets.filter((pet) => pet.tier === index + 1).map((pet) => toPetData(pet, 1)),
    foods: foods.filter((food) => food.tier === index + 1),
  }));
}

function getTierSprites(tiers: readonly PackTier[]): string[] {
  return tiers.flatMap(({ pets, foods }) => [...pets, ...foods].map((entry) => entry.sprite));
}

// Looks up each ID, throwing for unknown or repeated ones.
function lookUpIds<T>(ids: readonly number[], byId: Readonly<Record<number, T>>, kind: string): T[] {
  if (new Set(ids).size !== ids.length) throw new Error(`Repeated ${kind} ID`);
  return ids.map((id) => {
    if (!(id in byId)) throw new Error(`Unknown ${kind} ID ${id}`);
    return byId[id];
  });
}

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((item) => typeof item === "number");
}

function isSerializedPack(value: unknown): value is SerializedPack {
  if (typeof value !== "object" || value === null) return false;
  const pack = value as Record<string, unknown>;
  return (
    typeof pack.name === "string" &&
    typeof pack.icon === "number" &&
    isNumberArray(pack.pets) &&
    isNumberArray(pack.foods) &&
    typeof pack.isValid === "boolean"
  );
}

// The pack creation rules (Pack spec), plus two token rules: no tokens in the
// pack, and a non-token icon.
function followsPackRules({ name, icon, tier }: Pick<PackData, "name" | "icon" | "tier">): boolean {
  const trimmedName = name.trim();
  const isReservedName = RESERVED_PACK_NAMES.some(
    (reserved) => reserved.toLowerCase() === trimmedName.toLowerCase()
  );
  const iconPet = PET_BY_ID[icon];
  return (
    trimmedName !== "" &&
    !isReservedName &&
    iconPet !== undefined &&
    !iconPet.isToken &&
    tier.every(
      ({ pets, foods }) =>
        pets.length === PETS_PER_TIER &&
        foods.length === FOODS_PER_TIER &&
        [...pets, ...foods].every((entry) => !entry.isToken)
    )
  );
}

export class Pack {
  readonly data: PackData;

  constructor(data: PackData) {
    this.data = data;
  }

  // Tags spec. Stored on PackData when a pack is built.
  static tagOverview(tier: readonly PackTier[]): TagOverview {
    return {
      superTags: tier.flatMap(({ pets }) => pets).reduce((total, pet) => total + pet.superTags, 0),
      tierBreakdown: tier.map(({ pets }) => {
        const tagCounts: Partial<Record<Tag, number>> = {};
        for (const tag of pets.flatMap((pet) => pet.tags)) tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
        return tagCounts;
      }),
    };
  }

  // Throws for a pet or food ID that doesn't exist, is repeated, or is
  // outside the shop tiers. `isValid` is worked out again, not trusted.
  static fromSerialized({ name, icon, pets, foods }: SerializedPack): Pack {
    const tier = groupByTier(lookUpIds(pets, PET_BY_ID, "pet"), lookUpIds(foods, FOOD_BY_ID, "food"));
    const data = { name, icon, tier, tagOverview: Pack.tagOverview(tier) };
    return new Pack({ ...data, isValid: followsPackRules(data) });
  }

  // Throws for a code that isn't a pack.
  static fromCode(code: string): Pack {
    let serialized: unknown;
    try {
      const bytes = Uint8Array.from(atob(code.trim()), (char) => char.charCodeAt(0));
      serialized = JSON.parse(new TextDecoder().decode(bytes));
    } catch {
      throw new Error("Not a pack code");
    }
    if (!isSerializedPack(serialized)) throw new Error("Not a pack code");
    return Pack.fromSerialized(serialized);
  }

  // A copy with `isValid` set; this pack is left unchanged.
  validate(): Pack {
    return new Pack({ ...this.data, isValid: followsPackRules(this.data) });
  }

  // Tags spec: some tier has more than MAX_SAME_TAG_PER_TIER pets with one
  // archetype, or the pack has more than MAX_SUPER_TAGS_PER_PACK Super tags.
  // Kept separate from isValid.
  isWild(): boolean {
    const { superTags, tierBreakdown } = this.data.tagOverview;
    return (
      superTags > MAX_SUPER_TAGS_PER_PACK ||
      tierBreakdown.some((tagCounts) => Object.values(tagCounts).some((count) => count > MAX_SAME_TAG_PER_TIER))
    );
  }

  serialize(): SerializedPack {
    const { name, icon, tier, isValid } = this.data;
    return {
      name,
      icon,
      pets: tier.flatMap(({ pets }) => pets.map((pet) => pet.id)),
      foods: tier.flatMap(({ foods }) => foods.map((food) => food.id)),
      isValid,
    };
  }

  // Every sprite the pack viewer can show for this pack.
  getSprites(): string[] {
    return getTierSprites(this.data.tier);
  }

  // The serialized pack as base64 JSON, for import and export.
  toCode(): string {
    const bytes = new TextEncoder().encode(JSON.stringify(this.serialize()));
    return btoa(String.fromCharCode(...bytes));
  }
}

// A pre-built pack. The pack creation rules and WILD only apply to custom
// packs (Pack and Tags specs), so a static pack is built valid and is never
// passed to validate() or isWild().
export class StaticPack extends Pack {
  // The fangame's own pets and foods, shown by the viewer's "Custom exclusive" checkbox.
  readonly customTier: readonly PackTier[];

  constructor(data: PackData, customTier: readonly PackTier[]) {
    super(data);
    this.customTier = customTier;
  }

  getSprites(): string[] {
    return [...super.getSprites(), ...getTierSprites(this.customTier)];
  }
}

const TURTLE_TIER = groupByTier(SHOP_PET_POOL, SHOP_FOOD_POOL);

export const TURTLE_PACK = new StaticPack(
  {
    name: "Turtle",
    icon: Turtle.id,
    tier: TURTLE_TIER,
    isValid: true,
    tagOverview: Pack.tagOverview(TURTLE_TIER),
  },
  groupByTier(
    CUSTOMS_PETS.filter((pet) => !pet.isToken),
    CUSTOMS_FOODS.filter((food) => !food.isToken)
  )
);

export const STATIC_PACKS: readonly StaticPack[] = [TURTLE_PACK];

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
