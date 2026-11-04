import { describe, it, expect } from "vitest";
import { generateShop, clearDiscount, getTierUnlockTurn, getUnlockedTiers } from "@/lib/game/shop";
import {
  SAP_OTHER_PETS,
  SHOP_PET_POOL,
  TURTLE_PACK_PETS,
  Duck,
  getAllLevelsTooltipText,
  getPetTooltipText,
} from "@/lib/pets";
import { FOOD_REGISTRY, SHOP_FOOD_POOL, getFoodTooltipText, getPerkTooltipText } from "@/lib/foods";
import type { StaticPet, FoodType } from "@/lib/types";

// Minimal multi-tier pack for tier-unlock tests
const TIER1_PET: StaticPet = { name: "Sloth", sprite: "", tier: 1, baseAttack: 1, baseHealth: 1, isToken: false, abilities: new Map(), description: "" };
const TIER2_PET: StaticPet = { name: "Tiger", sprite: "", tier: 2, baseAttack: 4, baseHealth: 3, isToken: false, abilities: new Map(), description: "" };
const TIER1_FOOD: FoodType = { name: "Apple", sprite: "", tier: 1, isToken: false, effect: { attack: 1, health: 1 }, description: "" };
const TIER2_FOOD: FoodType = { name: "Salad", sprite: "", tier: 2, isToken: false, effect: { health: 2 }, description: "" };
const MULTI_TIER_PETS = [TIER1_PET, TIER2_PET];
const MULTI_TIER_FOODS = [TIER1_FOOD, TIER2_FOOD];

describe("generateShop", () => {
  it.each([
    { tier: 1, names: ["Duck", "Beaver", "Pigeon", "Otter", "Pig", "Ant", "Mosquito", "Fish", "Cricket", "Horse"] },
    { tier: 2, names: ["Snail", "Crab", "Swan", "Peacock", "Kangaroo", "Hedgehog", "Flamingo", "Worm", "Spider", "Rat"] },
    { tier: 3, names: ["Dodo", "Badger", "Dolphin", "Elephant", "Rabbit", "Giraffe", "Camel", "Dog", "Sheep", "Ox"] },
    { tier: 4, names: ["Skunk", "Hippo", "Bison", "Squirrel", "Penguin", "Blowfish", "Turtle", "Whale", "Deer"] },
    { tier: 5, names: ["Scorpion", "Crocodile", "Rhino", "Armadillo", "Turkey", "Monkey", "Seal", "Rooster", "Cow", "Shark"] },
    { tier: 6, names: ["Leopard", "Boar", "Tiger", "Dragon", "Mammoth", "Snake", "Wolverine", "Gorilla", "Fly", "Cat"] },
  ])("has exactly the Turtle pack's tier $tier pets", ({ tier, names }) => {
    const tierPets = TURTLE_PACK_PETS.filter((pet) => !pet.isToken && pet.tier === tier);
    expect(new Set(tierPets.map((pet) => pet.name))).toEqual(new Set(names));
  });

  it("has exactly the Turtle pack's tokens", () => {
    const tokens = TURTLE_PACK_PETS.filter((pet) => pet.isToken);
    expect(new Set(tokens.map((pet) => pet.name))).toEqual(
      new Set(["Zombie Cricket", "Bee", "Ram", "Chick", "Bus", "Dirty Rat", "Zombie Fly"])
    );
  });

  it("includes SAP Other non-token pets in the shop pool", () => {
    const shopableNames = SAP_OTHER_PETS.filter((pet) => !pet.isToken).map((pet) => pet.name);
    expect(SHOP_PET_POOL.map((pet) => pet.name)).toEqual(expect.arrayContaining(shopableNames));
  });

  it("returns 3 pet slots and 1 food slot at turn 1", () => {
    const shop = generateShop({ turn: 1, pack: SHOP_PET_POOL, foodTypes: SHOP_FOOD_POOL });
    expect(shop.shopPets).toHaveLength(3);
    expect(shop.shopFoods).toHaveLength(1);
  });

  it("returns 4 pet slots and 2 food slots at turn 5", () => {
    const shop = generateShop({ turn: 5, pack: SHOP_PET_POOL, foodTypes: SHOP_FOOD_POOL });
    expect(shop.shopPets).toHaveLength(4);
    expect(shop.shopFoods).toHaveLength(2);
  });

  it("returns 5 pet slots at turn 9", () => {
    const shop = generateShop({ turn: 9, pack: SHOP_PET_POOL, foodTypes: SHOP_FOOD_POOL });
    expect(shop.shopPets).toHaveLength(5);
  });

  it("all turn-1 pets are tier-1 pets", () => {
    const shop = generateShop({ turn: 1, pack: SHOP_PET_POOL, foodTypes: SHOP_FOOD_POOL });
    const tier1Names = new Set(SHOP_PET_POOL.filter((p) => p.tier === 1).map((p) => p.name));
    for (const pet of shop.shopPets) {
      expect(tier1Names.has(pet.type)).toBe(true);
      expect(pet.frozen).toBe(false);
    }
  });

  it("all turn-1 foods are tier-1 foods", () => {
    const shop = generateShop({ turn: 1, pack: SHOP_PET_POOL, foodTypes: SHOP_FOOD_POOL });
    const tier1FoodNames = new Set(SHOP_FOOD_POOL.filter((f) => f.tier === 1).map((f) => f.name));
    expect(tier1FoodNames.has(shop.shopFoods[0].type)).toBe(true);
    expect(shop.shopFoods[0].frozen).toBe(false);
  });

  it("preserves frozen pets at the front", () => {
    const frozenPets = [{ type: "Sloth", frozen: true }];
    const shop = generateShop({
      turn: 1,
      pack: SHOP_PET_POOL,
      foodTypes: SHOP_FOOD_POOL,
      frozenPets,
    });
    expect(shop.shopPets).toHaveLength(3);
    expect(shop.shopPets[0].frozen).toBe(true);
    expect(shop.shopPets[0].type).toBe("Sloth");
  });

  it("preserves frozen foods at the front", () => {
    const frozenFoods = [{ type: "Apple", frozen: true }];
    const shop = generateShop({
      turn: 1,
      pack: SHOP_PET_POOL,
      foodTypes: SHOP_FOOD_POOL,
      frozenFoods,
    });
    expect(shop.shopFoods).toHaveLength(1);
    expect(shop.shopFoods[0].frozen).toBe(true);
    expect(shop.shopFoods[0].type).toBe("Apple");
  });

  it("preserves multiple frozen pets and fills remaining slots", () => {
    const frozenPets = [
      { type: "Sloth", frozen: true },
      { type: "Sloth", frozen: true },
    ];
    const shop = generateShop({
      turn: 1,
      pack: SHOP_PET_POOL,
      foodTypes: SHOP_FOOD_POOL,
      frozenPets,
    });
    expect(shop.shopPets).toHaveLength(3);
    expect(shop.shopPets[0].frozen).toBe(true);
    expect(shop.shopPets[1].frozen).toBe(true);
    expect(shop.shopPets[2].frozen).toBe(false);
  });

  it("does not exceed slot count when frozen items fill all slots", () => {
    const frozenPets = [
      { type: "Sloth", frozen: true },
      { type: "Sloth", frozen: true },
      { type: "Sloth", frozen: true },
    ];
    const shop = generateShop({
      turn: 1,
      pack: SHOP_PET_POOL,
      foodTypes: SHOP_FOOD_POOL,
      frozenPets,
    });
    expect(shop.shopPets).toHaveLength(3);
    expect(shop.shopPets.every((p) => p.frozen)).toBe(true);
  });

  it("returns no pets when pack is empty", () => {
    const shop = generateShop({ turn: 1, pack: [], foodTypes: SHOP_FOOD_POOL });
    expect(shop.shopPets).toHaveLength(0);
  });

  it("returns no foods when food pool is empty", () => {
    const shop = generateShop({ turn: 1, pack: SHOP_PET_POOL, foodTypes: [] });
    expect(shop.shopFoods).toHaveLength(0);
  });

  it("unlocks tier-2 pets at turn 3", () => {
    const shop = generateShop({ turn: 3, pack: MULTI_TIER_PETS, foodTypes: MULTI_TIER_FOODS });
    const types = shop.shopPets.map((p) => p.type);
    // Both tiers are in the pool so Tiger can appear
    expect(types.every((t) => t === "Sloth" || t === "Tiger")).toBe(true);
  });

  it("only shows tier-1 pets at turn 1 when pool has multiple tiers", () => {
    const shop = generateShop({ turn: 1, pack: MULTI_TIER_PETS, foodTypes: MULTI_TIER_FOODS });
    expect(shop.shopPets.every((p) => p.type === "Sloth")).toBe(true);
  });

  it("only shows tier-1 foods at turn 1 when pool has multiple tiers", () => {
    const shop = generateShop({ turn: 1, pack: MULTI_TIER_PETS, foodTypes: MULTI_TIER_FOODS });
    expect(shop.shopFoods.every((f) => f.type === "Apple")).toBe(true);
  });

  it("surfaces real tier-2 pets at turn 3 using the actual pack", () => {
    const tier2Names = new Set(SHOP_PET_POOL.filter((p) => p.tier === 2).map((p) => p.name));
    const unlockedNames = new Set(SHOP_PET_POOL.filter((p) => p.tier <= 2).map((p) => p.name));
    let sawTier2 = false;
    for (let i = 0; i < 50; i++) {
      const shop = generateShop({ turn: 3, pack: SHOP_PET_POOL, foodTypes: SHOP_FOOD_POOL });
      for (const p of shop.shopPets) {
        expect(unlockedNames.has(p.type)).toBe(true);
        if (tier2Names.has(p.type)) sawTier2 = true;
      }
    }
    expect(sawTier2).toBe(true);
  });

  it("surfaces real tier-6 pets at turn 11 using the actual pack", () => {
    const tier6Names = new Set(SHOP_PET_POOL.filter((p) => p.tier === 6).map((p) => p.name));
    let sawTier6 = false;
    for (let i = 0; i < 50; i++) {
      const shop = generateShop({ turn: 11, pack: SHOP_PET_POOL, foodTypes: SHOP_FOOD_POOL });
      if (shop.shopPets.some((p) => tier6Names.has(p.type))) sawTier6 = true;
    }
    expect(sawTier6).toBe(true);
  });
});

describe("getTierUnlockTurn", () => {
  it.each([
    { tier: 1, turn: 1 },
    { tier: 2, turn: 3 },
    { tier: 3, turn: 5 },
    { tier: 4, turn: 7 },
    { tier: 5, turn: 9 },
    { tier: 6, turn: 11 },
  ])("unlocks tier $tier on turn $turn", ({ tier, turn }) => {
    expect(getTierUnlockTurn(tier)).toBe(turn);
  });
});

describe("getUnlockedTiers", () => {
  it.each([
    { turn: 1, tiers: [1] },
    { turn: 2, tiers: [1] },
    { turn: 3, tiers: [1, 2] },
    { turn: 4, tiers: [1, 2] },
    { turn: 5, tiers: [1, 2, 3] },
    { turn: 7, tiers: [1, 2, 3, 4] },
    { turn: 9, tiers: [1, 2, 3, 4, 5] },
    { turn: 11, tiers: [1, 2, 3, 4, 5, 6] },
    { turn: 20, tiers: [1, 2, 3, 4, 5, 6] },
  ])("unlocks tiers $tiers on turn $turn", ({ turn, tiers }) => {
    expect(getUnlockedTiers(turn)).toEqual(tiers);
  });
});

describe("clearDiscount", () => {
  it("removes the discount without touching other fields or the original", () => {
    const item = { type: "Apple", frozen: true, discount: 2 };
    const cleared = clearDiscount(item);
    expect(cleared).toEqual({ type: "Apple", frozen: true });
    expect(item.discount).toBe(2);
  });
});

describe("generateShop", () => {
  it("keeps a frozen food's discount but gives newly generated foods full price", () => {
    const frozen = { type: "Apple", frozen: true, discount: 1 };
    const shop = generateShop({
      turn: 5,
      pack: MULTI_TIER_PETS,
      foodTypes: [TIER1_FOOD],
      frozenFoods: [frozen],
    });
    expect(shop.shopFoods[0].discount).toBe(1);
    expect(shop.shopFoods.length).toBeGreaterThan(1);
    expect(shop.shopFoods.slice(1).every((f) => f.discount === undefined)).toBe(true);
  });
});

describe("getAllLevelsTooltipText", () => {
  it("puts each level's ability on its own line", () => {
    expect(getAllLevelsTooltipText(Duck)).toBe(
      "Duck\nL1 Sell: Give shop pets +1 health.\nL2 Sell: Give shop pets +2 health.\nL3 Sell: Give shop pets +3 health."
    );
  });
});

describe("getPetTooltipText", () => {
  it("shows only the pet ability and not any note text", () => {
    const pet = {
      name: "Duck",
      sprite: "",
      tier: 1,
      baseAttack: 1,
      baseHealth: 1,
      isToken: false,
      abilities: new Map(),
      description: (level: number) => `Sell: Give shop pets +${level} health.\n\nSimilar targeting to Armadillo.`,
    };

    expect(getPetTooltipText(pet, 1)).toBe("Duck\nSell: Give shop pets +1 health.");
    expect(getPetTooltipText(pet, 1)).not.toContain("Similar targeting");
    expect(getPetTooltipText(pet, 1)).not.toContain("Notes:");
    expect(getPetTooltipText(pet, 1)).not.toContain("Level up reward");
  });
});

describe("getFoodTooltipText", () => {
  it("puts the food's name above its description", () => {
    expect(getFoodTooltipText(FOOD_REGISTRY["Apple"])).toBe(
      "Apple\nGive one pet +1 attack and +1 health."
    );
  });

  it("is empty for an unknown food, so no tooltip shows", () => {
    expect(getFoodTooltipText(undefined)).toBe("");
  });
});

describe("perk tooltips", () => {
  const PERK_FOODS = [
    { name: "Bread", ability: "End turn: Gain +7 health until next turn." },
    { name: "Cake", ability: "End turn: Increase sell value by 1 gold." },
    { name: "Chili", ability: "Attack second enemy for 5 damage." },
    { name: "Garlic", ability: "Take 2 less damage. It can't be reduced to less than 2." },
    { name: "Honey", ability: "Faint: Summon a 1/1 Bee." },
    { name: "Meat Bone", ability: "Attack with +3 damage." },
    { name: "Melon", ability: "Take 20 damage less, once." },
    { name: "Mushroom", ability: "Faint: Come back as a 1/1." },
    { name: "Steak", ability: "Attack with +20 damage, once." },
  ];

  it.each(PERK_FOODS)("says $name gives the perk in the shop", ({ name, ability }) => {
    expect(getFoodTooltipText(FOOD_REGISTRY[name])).toBe(
      `${name}\nGive one pet the ${name} perk. ${ability}`
    );
  });

  it.each([
    ...PERK_FOODS,
    { name: "Coconut", ability: "Block damage, once." },
    { name: "Peanut", ability: "Knock out any pet attacked and hurt by this." },
  ])("shows only the ability when $name is held", ({ name, ability }) => {
    expect(getPerkTooltipText(name)).toBe(`${name}\n${ability}`);
  });

  it("is empty for a food without a perk, so no tooltip shows", () => {
    expect(getPerkTooltipText("Apple")).toBe("");
  });
});
