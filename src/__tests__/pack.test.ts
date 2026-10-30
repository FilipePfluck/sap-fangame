import { describe, it, expect } from "vitest";
import { getFoodTooltipPages, getPackTierRows, getPetTooltipPages } from "@/lib/game/pack";
import { FOOD_REGISTRY } from "@/lib/foods";
import { PET_REGISTRY } from "@/lib/pets";

function getRow(tier: number) {
  return getPackTierRows().find((row) => row.tier === tier)!;
}

describe("getPackTierRows", () => {
  it("has a row per tier with its unlock turn", () => {
    expect(getPackTierRows().map(({ tier, unlockTurn }) => ({ tier, unlockTurn }))).toEqual([
      { tier: 1, unlockTurn: 1 },
      { tier: 2, unlockTurn: 3 },
      { tier: 3, unlockTurn: 5 },
      { tier: 4, unlockTurn: 7 },
      { tier: 5, unlockTurn: 9 },
      { tier: 6, unlockTurn: 11 },
    ]);
  });

  it.each([
    { tier: 1, names: ["Duck", "Beaver", "Pigeon", "Otter", "Pig", "Ant", "Mosquito", "Fish", "Cricket", "Horse"] },
    { tier: 2, names: ["Snail", "Crab", "Swan", "Peacock", "Kangaroo", "Hedgehog", "Flamingo", "Worm", "Spider", "Rat"] },
    { tier: 3, names: ["Dodo", "Badger", "Dolphin", "Elephant", "Rabbit", "Giraffe", "Camel", "Dog", "Sheep", "Ox", "Sugar Glider"] },
    { tier: 4, names: ["Skunk", "Hippo", "Bison", "Squirrel", "Penguin", "Blowfish", "Turtle", "Whale", "Deer", "Seagull", "Jerboa"] },
    { tier: 5, names: ["Scorpion", "Crocodile", "Rhino", "Armadillo", "Turkey", "Monkey", "Seal", "Rooster", "Cow", "Shark", "Flounder"] },
    { tier: 6, names: ["Leopard", "Boar", "Tiger", "Dragon", "Mammoth", "Snake", "Wolverine", "Gorilla", "Fly", "Cat", "Alpaca"] },
  ])("has exactly the tier $tier pets", ({ tier, names }) => {
    expect(new Set(getRow(tier).pets.map((pet) => pet.name))).toEqual(new Set(names));
  });

  it.each([
    { tier: 1, names: ["Apple", "Honey"] },
    { tier: 2, names: ["Pill", "Meat Bone", "Cupcake"] },
    { tier: 3, names: ["Garlic", "Salad Bowl", "Cake"] },
    { tier: 4, names: ["Bread", "Canned Food", "Pear"] },
    { tier: 5, names: ["Sushi", "Chili", "Chocolate"] },
    { tier: 6, names: ["Melon", "Steak", "Mushroom", "Pizza"] },
  ])("has exactly the tier $tier foods", ({ tier, names }) => {
    expect(new Set(getRow(tier).foods.map((food) => food.name))).toEqual(new Set(names));
  });

  it("leaves out tokens", () => {
    const entries = getPackTierRows().flatMap((row) => [...row.pets, ...row.foods]);
    expect(entries.filter((entry) => entry.isToken)).toEqual([]);
  });
});

describe("getFoodTooltipPages", () => {
  it("gives Honey its description, then Bee", () => {
    expect(getFoodTooltipPages(FOOD_REGISTRY["Honey"])).toEqual([
      "Honey\nGive one pet the Honey perk: Faint: Summon a 1/1 Bee.",
      "Bee\nL1 No ability.\nL2 No ability.\nL3 No ability.",
    ]);
  });

  it("gives other foods a single page", () => {
    const multiPageFoods = Object.values(FOOD_REGISTRY).filter(
      (food) => getFoodTooltipPages(food).length > 1
    );
    expect(multiPageFoods.map((food) => food.name)).toEqual(["Honey"]);
  });
});

describe("getPetTooltipPages", () => {
  it("gives Deer its ability, then Bus, then Chili", () => {
    expect(getPetTooltipPages(PET_REGISTRY["Deer"])).toEqual([
      "Deer\nL1 Faint: Summon one 5/3 Bus with Chili.\nL2 Faint: Summon one 10/6 Bus with Chili.\nL3 Faint: Summon one 15/9 Bus with Chili.",
      "Bus\nL1 No ability.\nL2 No ability.\nL3 No ability.",
      "Chili\nGive one pet the Chili perk. Attack second enemy for 5 damage.",
    ]);
  });

  it("shows a linked pet's scaling ability per level", () => {
    expect(getPetTooltipPages(PET_REGISTRY["Flounder"])[1]).toBe(
      "Adult Flounder\nL1 Transformed: Give the two back-most friends +1 experience.\nL2 Transformed: Give the two back-most friends +2 experience.\nL3 Transformed: Give the two back-most friends +3 experience."
    );
  });

  it.each([
    { name: "Pigeon", links: ["Bread Crumbs"] },
    { name: "Cricket", links: ["Zombie Cricket"] },
    { name: "Worm", links: ["Apple", "Better Apple", "Best Apple"] },
    { name: "Rat", links: ["Dirty Rat"] },
    { name: "Sugar Glider", links: ["Cupcake"] },
    { name: "Sheep", links: ["Ram"] },
    { name: "Turtle", links: ["Melon"] },
    { name: "Ox", links: ["Melon"] },
    { name: "Jerboa", links: ["Apple"] },
    { name: "Scorpion", links: ["Peanut"] },
    { name: "Rooster", links: ["Chick"] },
    { name: "Cow", links: ["Milk", "Better Milk", "Best Milk"] },
    { name: "Flounder", links: ["Adult Flounder"] },
    { name: "Deer", links: ["Bus", "Chili"] },
    { name: "Gorilla", links: ["Coconut"] },
    { name: "Fly", links: ["Zombie Fly"] },
  ])("links $name to $links", ({ name, links }) => {
    const linkedPages = getPetTooltipPages(PET_REGISTRY[name]).slice(1);
    expect(linkedPages.map((page) => page.split("\n")[0])).toEqual(links);
  });

  it.each(["Duck", "Spider", "Seagull"])("gives %s a single page", (name) => {
    expect(getPetTooltipPages(PET_REGISTRY[name])).toHaveLength(1);
  });
});
