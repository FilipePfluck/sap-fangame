import { describe, it, expect } from "vitest";
import { generateShop, clearDiscount } from "@/lib/game/shop";
import { SHOP_PET_POOL } from "@/lib/pets";
import { SHOP_FOOD_POOL } from "@/lib/foods";
import type { PetType, FoodType } from "@/lib/types";

// Minimal multi-tier pack for tier-unlock tests
const TIER1_PET: PetType = { name: "Sloth", sprite: "", tier: 1, baseAttack: 1, baseHealth: 1, isToken: false, ability: null, description: "" };
const TIER2_PET: PetType = { name: "Tiger", sprite: "", tier: 2, baseAttack: 4, baseHealth: 3, isToken: false, ability: null, description: "" };
const TIER1_FOOD: FoodType = { name: "Apple", sprite: "", tier: 1, isToken: false, effect: { attack: 1, health: 1 }, description: "" };
const TIER2_FOOD: FoodType = { name: "Salad", sprite: "", tier: 2, isToken: false, effect: { health: 2 }, description: "" };
const MULTI_TIER_PETS = [TIER1_PET, TIER2_PET];
const MULTI_TIER_FOODS = [TIER1_FOOD, TIER2_FOOD];

describe("generateShop", () => {
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

describe("clearDiscount", () => {
  it("removes the discount without touching other fields or the original", () => {
    const item = { type: "Apple", frozen: true, discount: 2 };
    const cleared = clearDiscount(item);
    expect(cleared).toEqual({ type: "Apple", frozen: true });
    expect(item.discount).toBe(2);
  });
});

describe("generateShop — discounts", () => {
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
