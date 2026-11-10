import { describe, it, expect } from "vitest";
import { Pack, STATIC_PACKS, TURTLE_PACK, getTooltipPages, type SerializedPack } from "@/lib/game/pack";
import { RESERVED_PACK_NAMES } from "@/lib/game/rules";
import { Tag } from "@/lib/types";
import { FOOD_REGISTRY } from "@/lib/foods";
import { PET_REGISTRY } from "@/lib/pets";

// Turtle's 60 pets (IDs 1–60) and three foods per tier: Apple, Honey and
// Asparagus (27), then Turtle's foods 3–17.
const VALID_PACK: SerializedPack = {
  name: "My Pack",
  icon: 1,
  pets: Array.from({ length: 60 }, (_, index) => index + 1),
  foods: [1, 2, 27, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
  isValid: true,
};

function isValid(changes: Partial<SerializedPack>): boolean {
  return Pack.fromSerialized({ ...VALID_PACK, ...changes }).data.isValid;
}

function getTier(tier: number) {
  return TURTLE_PACK.data.tier[tier - 1];
}

describe("STATIC_PACKS", () => {
  it("reserves every static pack's name", () => {
    expect(STATIC_PACKS.filter((pack) => !RESERVED_PACK_NAMES.includes(pack.data.name))).toEqual([]);
  });

  it("keeps tokens out of Turtle's custom pets and foods", () => {
    const entries = TURTLE_PACK.customTier.flatMap(({ pets, foods }) => [...pets, ...foods]);
    expect(entries.filter((entry) => entry.isToken)).toEqual([]);
  });
});

describe("Turtle pack tiers", () => {
  it("has a tier per shop tier", () => {
    expect(TURTLE_PACK.data.tier).toHaveLength(6);
  });

  it.each([
    { tier: 1, names: ["Duck", "Beaver", "Pigeon", "Otter", "Pig", "Ant", "Mosquito", "Fish", "Cricket", "Horse"] },
    { tier: 2, names: ["Snail", "Crab", "Swan", "Peacock", "Kangaroo", "Hedgehog", "Flamingo", "Worm", "Spider", "Rat"] },
    { tier: 3, names: ["Dodo", "Badger", "Dolphin", "Elephant", "Rabbit", "Giraffe", "Camel", "Dog", "Sheep", "Ox"] },
    { tier: 4, names: ["Skunk", "Hippo", "Bison", "Squirrel", "Penguin", "Blowfish", "Turtle", "Whale", "Deer", "Parrot"] },
    { tier: 5, names: ["Scorpion", "Crocodile", "Rhino", "Armadillo", "Turkey", "Monkey", "Seal", "Rooster", "Cow", "Shark"] },
    { tier: 6, names: ["Leopard", "Boar", "Tiger", "Dragon", "Mammoth", "Snake", "Wolverine", "Gorilla", "Fly", "Cat"] },
  ])("has exactly the tier $tier pets", ({ tier, names }) => {
    expect(new Set(getTier(tier).pets.map((pet) => pet.name))).toEqual(new Set(names));
  });

  it.each([
    { tier: 1, names: ["Apple", "Honey"] },
    { tier: 2, names: ["Pill", "Meat Bone", "Cupcake"] },
    { tier: 3, names: ["Garlic", "Salad Bowl", "Cake"] },
    { tier: 4, names: ["Bread", "Canned Food", "Pear"] },
    { tier: 5, names: ["Sushi", "Chili", "Chocolate"] },
    { tier: 6, names: ["Melon", "Steak", "Mushroom", "Pizza"] },
  ])("has exactly the tier $tier foods", ({ tier, names }) => {
    expect(new Set(getTier(tier).foods.map((food) => food.name))).toEqual(new Set(names));
  });

  it("leaves out tokens", () => {
    const entries = TURTLE_PACK.data.tier.flatMap(({ pets, foods }) => [...pets, ...foods]);
    expect(entries.filter((entry) => entry.isToken)).toEqual([]);
  });
});

describe("Pack serialization", () => {
  it("round-trips through serialize", () => {
    expect(Pack.fromSerialized(VALID_PACK).serialize()).toEqual(VALID_PACK);
  });

  it("round-trips through a code", () => {
    expect(Pack.fromCode(Pack.fromSerialized(VALID_PACK).toCode()).serialize()).toEqual(VALID_PACK);
  });

  it("round-trips a name with emoji", () => {
    const pack = Pack.fromSerialized({ ...VALID_PACK, name: "Zoo 🐢" });
    expect(Pack.fromCode(pack.toCode()).data.name).toBe("Zoo 🐢");
  });

  it("groups pets and foods into their tiers", () => {
    const tierOne = Pack.fromSerialized(VALID_PACK).data.tier[0];
    expect([tierOne.pets.map((pet) => pet.id), tierOne.foods.map((food) => food.id)]).toEqual([
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      [1, 2, 27],
    ]);
  });

  it("works out isValid again instead of trusting it", () => {
    expect(Pack.fromSerialized({ ...VALID_PACK, name: "", isValid: true }).data.isValid).toBe(false);
  });

  it.each([
    { case: "an unknown pet ID", changes: { pets: [...VALID_PACK.pets, 999] }, error: "Unknown pet ID 999" },
    { case: "an unknown food ID", changes: { foods: [...VALID_PACK.foods, 999] }, error: "Unknown food ID 999" },
    { case: "a repeated pet ID", changes: { pets: [...VALID_PACK.pets, 1] }, error: "Repeated pet ID" },
    { case: "a repeated food ID", changes: { foods: [...VALID_PACK.foods, 1] }, error: "Repeated food ID" },
    { case: "a tier 7 food", changes: { foods: [...VALID_PACK.foods, 58] }, error: "Peanut Butter is not in a shop tier" },
  ])("rejects $case on import", ({ changes, error }) => {
    expect(() => Pack.fromSerialized({ ...VALID_PACK, ...changes })).toThrow(error);
  });

  it.each([
    { case: "isn't base64", code: "not a code!" },
    { case: "isn't JSON", code: btoa("not json") },
    { case: "isn't a pack", code: btoa(JSON.stringify({ name: "My Pack" })) },
  ])("rejects a code that $case", ({ code }) => {
    expect(() => Pack.fromCode(code)).toThrow("Not a pack code");
  });
});

describe("Pack.getSprites", () => {
  it("gives a custom pack's sprites", () => {
    const pack = Pack.fromSerialized({ name: "My Pack", icon: 69, pets: [69], foods: [27], isValid: false });
    expect(pack.getSprites()).toEqual(["/sap/Chinchilla.webp", "/sap/Asparagus.png"]);
  });

  it("gives a static pack's sprites, then its custom sprites", () => {
    expect(TURTLE_PACK.getSprites()).toHaveLength(60 + 18 + 66 + 26);
  });
});

describe("Pack tag overview", () => {
  // Hedgehog (13) and Peacock (15) are Hurt, Spider (18) is Summon with 2 Super
  // tags, and Camel (22) is Hurt.
  const pack = Pack.fromSerialized({ ...VALID_PACK, pets: [13, 15, 18, 22] });

  it("counts each archetype per tier", () => {
    expect(pack.data.tagOverview.tierBreakdown).toEqual([{}, { [Tag.Hurt]: 2, [Tag.Summon]: 1 }, { [Tag.Hurt]: 1 }, {}, {}, {}]);
  });

  it("counts Super tags across the pack", () => {
    expect(pack.data.tagOverview.superTags).toBe(2);
  });

  it("leaves the tag overview out of the serialized pack", () => {
    expect(Object.keys(pack.serialize())).toEqual(["name", "icon", "pets", "foods", "isValid"]);
  });
});

describe("Pack.isWild", () => {
  function isWild(pets: number[]): boolean {
    return Pack.fromSerialized({ ...VALID_PACK, pets }).isWild();
  }

  it("is Standard with 2 Hurt pets in a tier", () => {
    // Hedgehog and Peacock.
    expect(isWild([13, 15])).toBe(false);
  });

  it("is WILD with 3 Hurt pets in a tier", () => {
    // Hedgehog, Peacock and Rat.
    expect(isWild([13, 15, 16])).toBe(true);
  });

  it("is Standard with 2 Hurt pets in each of two tiers", () => {
    // Hedgehog and Peacock in tier 2, Camel and Elephant in tier 3.
    expect(isWild([13, 15, 22, 26])).toBe(false);
  });

  it("is Standard with 5 Super tags", () => {
    // Spider 2, Parrot 2 and Cat 1.
    expect(isWild([18, 35, 52])).toBe(false);
  });

  it("is WILD with 6 Super tags", () => {
    // Spider 2, Parrot 2 and Tiger 2.
    expect(isWild([18, 35, 59])).toBe(true);
  });

  it("doesn't depend on isValid", () => {
    expect(Pack.fromSerialized({ ...VALID_PACK, name: "", pets: [13, 15, 16] }).isWild()).toBe(true);
  });
});

describe("Pack.validate", () => {
  it("passes a pack that follows every rule", () => {
    expect(isValid({})).toBe(true);
  });

  it.each([
    { case: "a tier has 9 pets", changes: { pets: VALID_PACK.pets.slice(1) } },
    { case: "a tier has 11 pets", changes: { pets: [...VALID_PACK.pets, 69] } },
    { case: "a tier has 2 foods", changes: { foods: VALID_PACK.foods.slice(1) } },
    { case: "a tier has 4 foods", changes: { foods: [...VALID_PACK.foods, 28] } },
    { case: "the name is empty", changes: { name: "" } },
    { case: "the name is only spaces", changes: { name: "   " } },
    { case: "the name is reserved", changes: { name: "Turtle" } },
    { case: "the name is reserved in another case", changes: { name: " bee " } },
    { case: "the icon isn't a pet ID", changes: { icon: 999 } },
    { case: "the icon is a token", changes: { icon: 61 } },
    { case: "the pack has a token pet", changes: { pets: [135, ...VALID_PACK.pets.slice(1)] } },
    { case: "the pack has a token food", changes: { foods: [1, 2, 53, ...VALID_PACK.foods.slice(3)] } },
  ])("fails when $case", ({ changes }) => {
    expect(isValid(changes)).toBe(false);
  });

  it("leaves the original pack unchanged", () => {
    const pack = new Pack({ ...Pack.fromSerialized(VALID_PACK).data, isValid: false });
    pack.validate();
    expect(pack.data.isValid).toBe(false);
  });
});

describe("getTooltipPages for foods", () => {
  it("gives Honey its description, then Bee", () => {
    expect(getTooltipPages(FOOD_REGISTRY["Honey"])).toEqual([
      "Honey\nGive one pet the Honey perk. Faint: Summon a 1/1 Bee.",
      "Bee 1/1\nL1 No ability.\nL2 No ability.\nL3 No ability.",
    ]);
  });

  it("gives other foods a single page", () => {
    const multiPageFoods = Object.values(FOOD_REGISTRY).filter(
      (food) => getTooltipPages(food).length > 1
    );
    expect(multiPageFoods.map((food) => food.name)).toEqual(["Honey"]);
  });
});

describe("getTooltipPages for pets", () => {
  it("gives Deer its ability, then Bus, then Chili", () => {
    expect(getTooltipPages(PET_REGISTRY["Deer"])).toEqual([
      "Deer 2/2\nL1 Faint: Summon one 5/3 Bus with Chili.\nL2 Faint: Summon one 10/6 Bus with Chili.\nL3 Faint: Summon one 15/9 Bus with Chili.",
      "Bus 5/3\nL1 No ability.\nL2 No ability.\nL3 No ability.",
      "Chili\nGive one pet the Chili perk. Attack second enemy for 5 damage.",
    ]);
  });

  it("shows a linked pet's scaling ability per level", () => {
    expect(getTooltipPages(PET_REGISTRY["Flounder"])[1]).toBe(
      "Adult Flounder 2/4\nL1 Transformed: Give the two back-most friends +1 experience.\nL2 Transformed: Give the two back-most friends +2 experience.\nL3 Transformed: Give the two back-most friends +3 experience."
    );
  });

  it.each([
    { name: "Pigeon", links: ["Bread Crumbs"] },
    { name: "Cricket", links: ["Zombie Cricket 1/1"] },
    { name: "Worm", links: ["Apple", "Better Apple", "Best Apple"] },
    { name: "Rat", links: ["Dirty Rat 1/1"] },
    { name: "Sugar Glider", links: ["Cupcake"] },
    { name: "Sheep", links: ["Ram 2/2"] },
    { name: "Turtle", links: ["Melon"] },
    { name: "Ox", links: ["Melon"] },
    { name: "Jerboa", links: ["Apple"] },
    { name: "Scorpion", links: ["Peanut"] },
    { name: "Rooster", links: ["Chick 1/1"] },
    { name: "Cow", links: ["Milk", "Better Milk", "Best Milk"] },
    { name: "Flounder", links: ["Adult Flounder 2/4"] },
    { name: "Deer", links: ["Bus 5/3", "Chili"] },
    { name: "Gorilla", links: ["Coconut"] },
    { name: "Fly", links: ["Zombie Fly 4/4"] },
  ])("links $name to $links", ({ name, links }) => {
    const linkedPages = getTooltipPages(PET_REGISTRY[name]).slice(1);
    expect(linkedPages.map((page) => page.split("\n")[0])).toEqual(links);
  });

  it.each(["Duck", "Spider", "Seagull"])("gives %s a single page", (name) => {
    expect(getTooltipPages(PET_REGISTRY[name])).toHaveLength(1);
  });
});
