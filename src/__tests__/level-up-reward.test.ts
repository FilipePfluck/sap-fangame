import { describe, it, expect } from "vitest";
import { addLevelUpReward, getRewardTier, MAX_SHOP_SLOTS } from "@/lib/game/shop";
import { levelUpRewardEarned } from "@/lib/game/merge";
import { PET_REGISTRY, SHOP_PET_POOL } from "@/lib/pets";
import { applyFoodEffect } from "@/lib/game/food";
import { resolveExperienceLevelUps, resolveLevelUp } from "@/lib/game/shop-ability";
import { Chocolate } from "@/lib/foods/chocolate";
import type { ApiBoard, ShopState } from "@/lib/types";
import { EMPTY_SHOP, pet } from "./helpers";

describe("getRewardTier", () => {
  it("is one above the highest unlocked tier", () => {
    expect(getRewardTier(1)).toBe(2);
    expect(getRewardTier(5)).toBe(4); // tiers 1-3 unlocked on turn 5
  });
  it("caps at tier 6", () => {
    expect(getRewardTier(11)).toBe(6);
    expect(getRewardTier(20)).toBe(6);
  });
});

describe("addLevelUpReward", () => {
  it("adds two distinct next-tier pets sharing a chainId, unfrozen", () => {
    const shop = addLevelUpReward(EMPTY_SHOP, 4, SHOP_PET_POOL, "c1");
    expect(shop.shopPets).toHaveLength(2);
    expect(shop.shopPets.every((p) => p.chainId === "c1" && !p.frozen)).toBe(true);
    expect(shop.shopPets[0].type).not.toBe(shop.shopPets[1].type);
    for (const p of shop.shopPets) {
      expect(SHOP_PET_POOL.find((d) => d.name === p.type)?.tier).toBe(4);
    }
  });

  it("appends after existing shop pets without changing them", () => {
    const start: ShopState = { shopPets: [{ type: "Sloth", frozen: true }], shopFoods: [] };
    const shop = addLevelUpReward(start, 4, SHOP_PET_POOL);
    expect(shop.shopPets).toHaveLength(3);
    expect(shop.shopPets[0]).toEqual({ type: "Sloth", frozen: true });
  });

  it("deletes unfrozen items to fit the whole reward in a full shop", () => {
    const start: ShopState = {
      shopPets: Array(MAX_SHOP_SLOTS).fill(null).map((_, i) => ({ type: `Old${i}`, frozen: false })),
      shopFoods: [],
    };
    const shop = addLevelUpReward(start, 4, SHOP_PET_POOL, "c1");
    expect(shop.shopPets).toHaveLength(MAX_SHOP_SLOTS);
    expect(shop.shopPets.filter((p) => p.chainId === "c1")).toHaveLength(2);
    // with no foods to delete, the rightmost two pets were evicted
    expect(shop.shopPets.map((p) => p.type)).not.toContain("Old9");
    expect(shop.shopPets.map((p) => p.type)).not.toContain("Old8");
    expect(shop.shopPets.map((p) => p.type)).toContain("Old0");
    expect(shop.shopPets.map((p) => p.type)).toContain("Old7");
  });

  it("frozen items win: only as many reward pets as fit are stocked, unchained", () => {
    const start: ShopState = {
      shopPets: Array(MAX_SHOP_SLOTS - 1).fill(null).map(() => ({ type: "Sloth", frozen: true })),
      shopFoods: [],
    };
    const shop = addLevelUpReward(start, 4, SHOP_PET_POOL);
    expect(shop.shopPets).toHaveLength(MAX_SHOP_SLOTS);
    expect(shop.shopPets[MAX_SHOP_SLOTS - 1].chainId).toBeUndefined();
  });

  it("adds nothing when every slot is frozen", () => {
    const start: ShopState = {
      shopPets: Array(MAX_SHOP_SLOTS).fill(null).map(() => ({ type: "Sloth", frozen: true })),
      shopFoods: [],
    };
    const shop = addLevelUpReward(start, 4, SHOP_PET_POOL);
    expect(shop.shopPets.every((p) => p.type === "Sloth")).toBe(true);
    expect(shop.shopPets).toHaveLength(MAX_SHOP_SLOTS);
  });

  it("stocking pets deletes foods from the leftmost food before any pets", () => {
    const start: ShopState = {
      shopPets: Array(7).fill(null).map((_, i) => ({ type: `Old${i}`, frozen: false })),
      shopFoods: [
        { type: "Apple", frozen: false },
        { type: "Honey", frozen: false },
        { type: "Garlic", frozen: false },
      ],
    };
    const shop = addLevelUpReward(start, 4, SHOP_PET_POOL, "c1");
    expect(shop.shopFoods.map((f) => f.type)).toEqual(["Garlic"]);
    expect(shop.shopPets.filter((p) => p.type.startsWith("Old"))).toHaveLength(7);
  });

  it("evicts foods too once no unfrozen pets remain", () => {
    const start: ShopState = {
      shopPets: Array(8).fill(null).map(() => ({ type: "Sloth", frozen: true })),
      shopFoods: [{ type: "Apple", frozen: false }, { type: "Honey", frozen: false }],
    };
    const shop = addLevelUpReward(start, 4, SHOP_PET_POOL, "c1");
    expect(shop.shopFoods).toHaveLength(0);
    expect(shop.shopPets.filter((p) => p.chainId === "c1")).toHaveLength(2);
  });
});

describe("levelUpRewardEarned", () => {
  it("a merge that reaches 2 XP earns a reward", () => {
    expect(levelUpRewardEarned(pet({ xp: 1, level: 1 }), pet({ xp: 0, level: 1 }))).toBe(true);
  });
  it("merging two level-2 pets does not, regardless of xp", () => {
    expect(levelUpRewardEarned(pet({ xp: 2, level: 2 }), pet({ xp: 2, level: 2 }))).toBe(false);
    expect(levelUpRewardEarned(pet({ xp: 4, level: 2 }), pet({ xp: 4, level: 2 }))).toBe(false);
  });
  it("level 2 + level 1 reaching 5 XP earns a reward", () => {
    expect(levelUpRewardEarned(pet({ xp: 4, level: 2 }), pet({ xp: 0, level: 1 }))).toBe(true);
  });
  it("no reward when the merge does not level up", () => {
    expect(levelUpRewardEarned(pet({ xp: 0, level: 1 }), pet({ xp: 0, level: 1 }))).toBe(false);
    expect(levelUpRewardEarned(pet({ xp: 2, level: 2 }), pet({ xp: 0, level: 1 }))).toBe(false);
  });
});

const OPTIONS = { rewardTier: 3, rewardPool: SHOP_PET_POOL, petRegistry: PET_REGISTRY };

describe("resolveLevelUp", () => {
  it("stocks a level-up reward by default", () => {
    const board: ApiBoard = [pet({ type: "Ant", level: 2 })];
    const { shop } = resolveLevelUp(board, EMPTY_SHOP, 0, 1, OPTIONS);
    expect(shop.shopPets).toHaveLength(2);
  });

  it("stocks nothing when earnsReward is false", () => {
    const board: ApiBoard = [pet({ type: "Ant", level: 3 })];
    const { shop } = resolveLevelUp(board, EMPTY_SHOP, 0, 2, { ...OPTIONS, earnsReward: false });
    expect(shop.shopPets).toEqual([]);
  });
});

describe("resolveExperienceLevelUps", () => {
  it("stocks a level-up reward when food experience levels a pet up", () => {
    const before: ApiBoard = [pet({ type: "Ant", xp: 1 })];
    const after = applyFoodEffect(Chocolate, before, 0, PET_REGISTRY);
    const { shop } = resolveExperienceLevelUps(before, after, EMPTY_SHOP, OPTIONS);
    expect(shop.shopPets.length).toBeGreaterThan(0);
  });

  it("stocks nothing without a level-up", () => {
    const before: ApiBoard = [pet({ type: "Ant" })];
    const after = applyFoodEffect(Chocolate, before, 0, PET_REGISTRY);
    const { shop } = resolveExperienceLevelUps(before, after, EMPTY_SHOP, OPTIONS);
    expect(shop.shopPets).toEqual([]);
  });
});
