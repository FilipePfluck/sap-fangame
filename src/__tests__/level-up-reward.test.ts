import { describe, it, expect } from "vitest";
import { addLevelUpReward, getRewardTier, MAX_SHOP_SLOTS } from "@/lib/game/shop";
import { levelUpRewardEarned } from "@/lib/game/merge";
import { SHOP_PET_POOL } from "@/lib/pets";
import type { PetInstance, ShopState } from "@/lib/types";

const pet = (xp: number, level: number): PetInstance => ({
  type: "Cricket", attack: 1, health: 1, perk: null, xp, level,
});
const emptyShop: ShopState = { shopPets: [], shopFoods: [] };

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
    const shop = addLevelUpReward(emptyShop, 5, SHOP_PET_POOL, "c1");
    expect(shop.shopPets).toHaveLength(2);
    expect(shop.shopPets.every((p) => p.chainId === "c1" && !p.frozen)).toBe(true);
    expect(shop.shopPets[0].type).not.toBe(shop.shopPets[1].type);
    for (const p of shop.shopPets) {
      expect(SHOP_PET_POOL.find((d) => d.name === p.type)?.tier).toBe(4);
    }
  });

  it("appends after existing shop pets without changing them", () => {
    const start: ShopState = { shopPets: [{ type: "Sloth", frozen: true }], shopFoods: [] };
    const shop = addLevelUpReward(start, 5, SHOP_PET_POOL);
    expect(shop.shopPets).toHaveLength(3);
    expect(shop.shopPets[0]).toEqual({ type: "Sloth", frozen: true });
  });

  it("deletes unfrozen items to fit the whole reward in a full shop", () => {
    const start: ShopState = {
      shopPets: Array(MAX_SHOP_SLOTS).fill(null).map((_, i) => ({ type: `Old${i}`, frozen: false })),
      shopFoods: [],
    };
    const shop = addLevelUpReward(start, 5, SHOP_PET_POOL, "c1");
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
    const shop = addLevelUpReward(start, 5, SHOP_PET_POOL);
    expect(shop.shopPets).toHaveLength(MAX_SHOP_SLOTS);
    expect(shop.shopPets[MAX_SHOP_SLOTS - 1].chainId).toBeUndefined();
  });

  it("adds nothing when every slot is frozen", () => {
    const start: ShopState = {
      shopPets: Array(MAX_SHOP_SLOTS).fill(null).map(() => ({ type: "Sloth", frozen: true })),
      shopFoods: [],
    };
    const shop = addLevelUpReward(start, 5, SHOP_PET_POOL);
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
    const shop = addLevelUpReward(start, 5, SHOP_PET_POOL, "c1");
    expect(shop.shopFoods.map((f) => f.type)).toEqual(["Garlic"]);
    expect(shop.shopPets.filter((p) => p.type.startsWith("Old"))).toHaveLength(7);
  });

  it("evicts foods too once no unfrozen pets remain", () => {
    const start: ShopState = {
      shopPets: Array(8).fill(null).map(() => ({ type: "Sloth", frozen: true })),
      shopFoods: [{ type: "Apple", frozen: false }, { type: "Honey", frozen: false }],
    };
    const shop = addLevelUpReward(start, 5, SHOP_PET_POOL, "c1");
    expect(shop.shopFoods).toHaveLength(0);
    expect(shop.shopPets.filter((p) => p.chainId === "c1")).toHaveLength(2);
  });
});

describe("levelUpRewardEarned", () => {
  it("a merge that reaches 2 XP earns a reward", () => {
    expect(levelUpRewardEarned(pet(1, 1), pet(0, 1))).toBe(true);
  });
  it("merging two level-2 pets does not, regardless of xp", () => {
    expect(levelUpRewardEarned(pet(2, 2), pet(2, 2))).toBe(false);
    expect(levelUpRewardEarned(pet(4, 2), pet(4, 2))).toBe(false);
  });
  it("level 2 + level 1 reaching 5 XP earns a reward", () => {
    expect(levelUpRewardEarned(pet(4, 2), pet(0, 1))).toBe(true);
  });
  it("no reward when the merge does not level up", () => {
    expect(levelUpRewardEarned(pet(0, 1), pet(0, 1))).toBe(false);
    expect(levelUpRewardEarned(pet(2, 2), pet(0, 1))).toBe(false);
  });
});
