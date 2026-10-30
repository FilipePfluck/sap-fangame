import { describe, it, expect } from "vitest";
import { getPackTierRows } from "@/lib/game/pack";

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
    { tier: 5, names: ["Scorpion", "Crocodile", "Rhino", "Armadillo", "Turkey", "Monkey", "Seal", "Rooster", "Cow", "Flounder"] },
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
