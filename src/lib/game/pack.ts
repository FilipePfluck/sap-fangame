import type { FoodType, PackData, PackTier, SerializedPack, StaticPet, Tag, TagOverview } from "@/lib/types";
import {
  ALL_PETS,
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
  TURTLE_PACK_PETS,
  Turtle,
  Worm,
  ZombieCricket,
  ZombieFly,
  getAllLevelsTooltipText,
} from "@/lib/pets";
import {
  ALL_FOODS,
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
  TURTLE_PACK_FOODS,
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
import { pickN } from "@/lib/utils/random";

export type TooltipEntry = StaticPet | FoodType;

// Splits pets and foods into the shop tiers. Throws for anything outside them.
function groupByTier(pets: readonly StaticPet[], foods: readonly FoodType[]): readonly PackTier[] {
  const outsideShopTiers = [...pets, ...foods].find((entry) => entry.tier < 1 || entry.tier > MAX_TIER);
  if (outsideShopTiers) throw new Error(`${outsideShopTiers.name} is not in a shop tier`);
  return Array.from({ length: MAX_TIER }, (_, index) => ({
    pets: pets.filter((pet) => pet.tier === index + 1).map((pet) => toPetData(pet, 1)),
    foods: foods.filter((food) => food.tier === index + 1),
  }));
}

// Builds PackData's tag overview from the pets' tags.
function countTags(tier: readonly PackTier[]): TagOverview {
  return {
    superTags: tier.flatMap(({ pets }) => pets).reduce((total, pet) => total + pet.superTags, 0),
    tierBreakdown: tier.map(({ pets }) => {
      const tagCounts: Partial<Record<Tag, number>> = {};
      for (const tag of pets.flatMap((pet) => pet.tags)) tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
      return tagCounts;
    }),
  };
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

// A pack's import/export code: JSON with the pack's name, icon pet ID, pet IDs
// and food IDs.
type PackCode = Readonly<{
  Title: string;
  Minion: number;
  Minions: readonly number[];
  Spells: readonly number[];
}>;

function isPackCode(value: unknown): value is PackCode {
  if (typeof value !== "object" || value === null) return false;
  const code = value as Record<string, unknown>;
  return (
    typeof code.Title === "string" &&
    typeof code.Minion === "number" &&
    isNumberArray(code.Minions) &&
    isNumberArray(code.Spells)
  );
}

// A custom pack's name can't be blank or reserved, in any case.
export function isAllowedPackName(name: string): boolean {
  const trimmedName = name.trim();
  return (
    trimmedName !== "" &&
    !RESERVED_PACK_NAMES.some((reserved) => reserved.toLowerCase() === trimmedName.toLowerCase())
  );
}

// The pack creation rules (Pack spec), plus two token rules: no tokens in the
// pack, and a non-token icon.
function followsPackRules({ name, icon, tier }: Pick<PackData, "name" | "icon" | "tier">): boolean {
  const iconPet = PET_BY_ID[icon];
  return (
    isAllowedPackName(name) &&
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

  // Throws for a pet or food ID that doesn't exist, is repeated, or is
  // outside the shop tiers. `isValid` is worked out again, not trusted.
  static fromSerialized({ name, icon, pets, foods }: SerializedPack): Pack {
    const tier = groupByTier(lookUpIds(pets, PET_BY_ID, "pet"), lookUpIds(foods, FOOD_BY_ID, "food"));
    const data = { name, icon, tier, tagOverview: countTags(tier) };
    return new Pack({ ...data, isValid: followsPackRules(data) });
  }

  // Throws for a code that isn't a pack.
  static fromCode(code: string): Pack {
    let parsed: unknown;
    try {
      parsed = JSON.parse(code);
    } catch {
      throw new Error("Not a pack code");
    }
    if (!isPackCode(parsed)) throw new Error("Not a pack code");
    return Pack.fromSerialized({
      name: parsed.Title,
      icon: parsed.Minion,
      pets: parsed.Minions,
      foods: parsed.Spells,
      isValid: false,
    });
  }

  // A copy with `isValid` set; this pack is left unchanged.
  validate(): Pack {
    return new Pack({ ...this.data, isValid: followsPackRules(this.data) });
  }

  // Tags spec: some tier has more than MAX_SAME_TAG_PER_TIER pets with one
  // archetype, or the pack has more than MAX_SUPER_TAGS_PER_PACK Super tags.
  // Kept separate from isValid.
  isWild(): boolean {
    const { superTags, tierBreakdown } = this.tagOverview();
    return (
      superTags > MAX_SUPER_TAGS_PER_PACK ||
      tierBreakdown.some((tagCounts) => Object.values(tagCounts).some((count) => count > MAX_SAME_TAG_PER_TIER))
    );
  }

  // Tag counts for the UI, whether or not the pack is WILD (Tags spec).
  tagOverview(): TagOverview {
    return this.data.tagOverview;
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

  // The pack as an import/export code (see PackCode).
  toCode(): string {
    const { name, icon, pets, foods } = this.serialize();
    const code: PackCode = { Title: name, Minion: icon, Minions: pets, Spells: foods };
    return JSON.stringify(code);
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
    tagOverview: countTags(TURTLE_TIER),
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

export function isPet(entry: TooltipEntry): entry is StaticPet {
  return "abilities" in entry;
}

function getEntryPage(entry: TooltipEntry): string {
  return isPet(entry) ? getAllLevelsTooltipText(entry) : getFoodTooltipText(entry);
}

export function getTooltipPages(entry: TooltipEntry): readonly string[] {
  return [entry, ...(TOOLTIP_LINKS.get(entry) ?? [])].map(getEntryPage);
}

// The packs pets and foods come from, for the pack filters, in the pack
// editor's order. Only Turtle and Custom have any so far.
export enum PackSource {
  Turtle,
  Custom,
  Bee,
  Bell,
  Cheetah,
  Invasive,
  King,
  Leaf,
  Roomba,
  Shift,
}

export const PACK_SOURCE_NAMES: Readonly<Record<PackSource, string>> = {
  [PackSource.Turtle]: "Turtle",
  [PackSource.Custom]: "Custom",
  [PackSource.Bee]: "Bee",
  [PackSource.Bell]: "Bell",
  [PackSource.Cheetah]: "Cheetah",
  [PackSource.Invasive]: "Invasive",
  [PackSource.King]: "King",
  [PackSource.Leaf]: "Leaf",
  [PackSource.Roomba]: "Roomba",
  [PackSource.Shift]: "Shift",
};

// Each pack's icon.
export const PACK_SOURCE_SPRITES: Readonly<Record<PackSource, string>> = {
  [PackSource.Turtle]: "/sap/pack_turtle.png",
  [PackSource.Custom]: "/sap/pack_custom.png",
  [PackSource.Bee]: "/sap/pack_bee.png",
  [PackSource.Bell]: "/sap/pack_bell.png",
  [PackSource.Cheetah]: "/sap/pack_cheetah.png",
  [PackSource.Invasive]: "/sap/pack_invasive.png",
  [PackSource.King]: "/sap/pack_king.png",
  [PackSource.Leaf]: "/sap/pack_leaf.png",
  [PackSource.Roomba]: "/sap/pack_roomba.png",
  [PackSource.Shift]: "/sap/pack_shift.png",
};

// Numeric enums also map names back to values; keep only the values.
export const ALL_PACK_SOURCES: readonly PackSource[] = Object.values(PackSource).filter(
  (source): source is PackSource => typeof source === "number"
);

const PACK_SOURCE_ENTRIES: Readonly<Record<PackSource, ReadonlySet<TooltipEntry>>> = {
  [PackSource.Turtle]: new Set([...TURTLE_PACK_PETS, ...TURTLE_PACK_FOODS]),
  [PackSource.Custom]: new Set([...CUSTOMS_PETS, ...CUSTOMS_FOODS]),
  [PackSource.Bee]: new Set(),
  [PackSource.Bell]: new Set(),
  [PackSource.Cheetah]: new Set(),
  [PackSource.Invasive]: new Set(),
  [PackSource.King]: new Set(),
  [PackSource.Leaf]: new Set(),
  [PackSource.Roomba]: new Set(),
  [PackSource.Shift]: new Set(),
};

// The search bar's `pack:turtle`, `pack:custom`, ... queries.
const PACK_QUERIES: ReadonlyMap<string, PackSource> = new Map(
  ALL_PACK_SOURCES.map((source) => [`pack:${PACK_SOURCE_NAMES[source].toLowerCase()}`, source])
);

function matchesQueryWord(entry: TooltipEntry, word: string): boolean {
  const source = PACK_QUERIES.get(word);
  return source !== undefined
    ? PACK_SOURCE_ENTRIES[source].has(entry)
    : getEntryPage(entry).toLowerCase().includes(word);
}

// The pack editor's filters. Each kind narrows the list: an entry must be in
// one of the selected tiers, come from one of the selected packs, have one of
// the selected tags (or Super), and match every query word. An empty selection
// doesn't narrow.
export type PackFilter = Readonly<{
  tiers: readonly number[];
  packSources: readonly PackSource[];
  tags: readonly Tag[];
  // Pets with Super tags, alongside `tags`.
  superTag: boolean;
  // Words to find in the name or tooltip text. `pack:turtle`, `pack:custom`,
  // ... match by pack instead.
  query: string;
}>;

export const NO_PACK_FILTER: PackFilter = { tiers: [], packSources: [], tags: [], superTag: false, query: "" };

export function filterPack<T extends TooltipEntry>(
  entries: readonly T[],
  { tiers, packSources, tags, superTag, query }: PackFilter
): T[] {
  const words = query.toLowerCase().split(/\s+/).filter((word) => word !== "");
  const filtersTags = tags.length > 0 || superTag;
  return entries.filter(
    (entry) =>
      (tiers.length === 0 || tiers.includes(entry.tier)) &&
      (packSources.length === 0 || packSources.some((source) => PACK_SOURCE_ENTRIES[source].has(entry))) &&
      // Foods have no tags, so a tag or Super filter leaves them out.
      (!filtersTags ||
        (isPet(entry) && (entry.tags.some((tag) => tags.includes(tag)) || (superTag && entry.superTags > 0)))) &&
      words.every((word) => matchesQueryWord(entry, word))
  );
}

// Every pet and food a pack can hold: tokens are never in a pack.
export const NON_TOKEN_PETS: readonly StaticPet[] = ALL_PETS.filter((pet) => !pet.isToken);
export const NON_TOKEN_FOODS: readonly FoodType[] = ALL_FOODS.filter((food) => !food.isToken);

// Random pets and foods, the right number from each tier. Tags are ignored, so
// the result may be WILD.
export function getRandomPackIds(): Pick<SerializedPack, "pets" | "foods"> {
  const tiers = Array.from({ length: MAX_TIER }, (_, index) => index + 1);
  return {
    pets: tiers.flatMap((tier) =>
      pickN(NON_TOKEN_PETS.filter((pet) => pet.tier === tier), PETS_PER_TIER).map((pet) => pet.id)
    ),
    foods: tiers.flatMap((tier) =>
      pickN(NON_TOKEN_FOODS.filter((food) => food.tier === tier), FOODS_PER_TIER).map((food) => food.id)
    ),
  };
}
