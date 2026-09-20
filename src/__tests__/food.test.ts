import { describe, it, expect } from "vitest";
import { applyFoodEffect, applyFoodLevelUps, feedError, isValidFoodTarget, needsTarget } from "@/lib/game/food";
import { computeLevel } from "@/lib/game/merge";
import { PET_REGISTRY, SHOP_PET_POOL } from "@/lib/pets";
import { Apple, Chocolate, Honey, Pill, Sushi } from "@/lib/foods";
import type { Board, FoodType, PetInstance } from "@/lib/types";

function pet(type: string, attack = 2, health = 2): PetInstance {
  return { type, attack, health, perk: null, xp: 0, level: 1 };
}

describe("applyFoodEffect", () => {
  it("applies the attack/health bonus to the targeted pet for standard foods", () => {
    const board: Board = [pet("Ant"), pet("Fish"), null, null, null];
    const result = applyFoodEffect(Apple, board, 1, PET_REGISTRY);
    expect(result[1]).toMatchObject({ attack: 3, health: 3 });
    expect(result[0]).toMatchObject({ attack: 2, health: 2 });
  });

  it("sets the perk for perk foods", () => {
    const board: Board = [pet("Ant"), null, null, null, null];
    const result = applyFoodEffect(Honey, board, 0, PET_REGISTRY);
    expect(result[0]?.perk).toBe("Honey");
  });

  it("does not mutate the input board for standard foods", () => {
    const board: Board = [pet("Ant"), null, null, null, null];
    applyFoodEffect(Apple, board, 0, PET_REGISTRY);
    expect(board[0]).toMatchObject({ attack: 2, health: 2 });
  });

  it("uses the food's own applyEffect when present (Pill removes the pet)", () => {
    const board: Board = [pet("Ant"), pet("Fish"), null, null, null];
    const result = applyFoodEffect(Pill, board, 0, PET_REGISTRY);
    expect(result[0]).toBeNull();
    expect(result[1]).not.toBeNull();
  });

  it("Sushi buffs three random pets, wherever boardPosition points", () => {
    const board: Board = [pet("Ant"), pet("Fish"), pet("Pig"), pet("Cricket"), null];
    const result = applyFoodEffect(Sushi, board, 4, PET_REGISTRY);
    const buffed = result.filter((p) => p && p.attack === 3 && p.health === 3);
    expect(buffed).toHaveLength(3);
    expect(result[4]).toBeNull();
  });

  it("random-target foods buff every pet when fewer than asked for are on the board", () => {
    const board: Board = [pet("Ant"), null, pet("Fish"), null, null];
    const result = applyFoodEffect(Sushi, board, 0, PET_REGISTRY);
    expect(result.filter((p) => p && p.attack === 3)).toHaveLength(2);
  });

  it("random-target foods also apply perks to each target", () => {
    const perkFood: FoodType = { ...Honey, targeting: { random: 2 } };
    const board: Board = [pet("Ant"), pet("Fish"), pet("Pig"), null, null];
    const result = applyFoodEffect(perkFood, board, 0, PET_REGISTRY);
    expect(result.filter((p) => p?.perk === "Honey")).toHaveLength(2);
  });

  it("leaves the input board's pets untouched for random-target foods", () => {
    const board: Board = [pet("Ant"), pet("Fish"), pet("Pig"), null, null];
    applyFoodEffect(Sushi, board, 0, PET_REGISTRY);
    expect(board.every((p) => !p || (p.attack === 2 && p.health === 2))).toBe(true);
  });

  it("does not mutate the input board's pets for Pill either", () => {
    const board: Board = [pet("Ant"), pet("Fish"), null, null, null];
    applyFoodEffect(Pill, board, 0, PET_REGISTRY);
    expect(board.every((p) => !p || (p.attack === 2 && p.health === 2))).toBe(true);
  });
});

describe("needsTarget", () => {
  it("is true for chosen-target foods and false for random-target ones", () => {
    expect(needsTarget(Apple)).toBe(true);
    expect(needsTarget(Pill)).toBe(true);
    expect(needsTarget(Sushi)).toBe(false);
  });
});

describe("feedError", () => {
  const board: Board = [pet("Ant"), null, null, null, null];
  const empty: Board = [null, null, null, null, null];

  it("requires an occupied chosen slot for chosen-target foods", () => {
    expect(feedError(Apple, board, 0)).toBeNull();
    expect(feedError(Apple, board, 1)).toBe("Select a pet to feed");
    expect(feedError(Apple, board, undefined)).toBe("Select a pet to feed");
  });

  it("only requires some pet on the board for random-target foods", () => {
    expect(feedError(Sushi, board, undefined)).toBeNull();
    expect(feedError(Sushi, empty, undefined)).toBe("No pets to feed");
  });
});

describe("Chocolate", () => {
  const emptyShop = { shopPets: [], shopFoods: [] };
  const withXp = (type: string, xp: number): PetInstance => ({ ...pet(type), xp, level: computeLevel(xp) });

  it("is a tier 5 food that needs a target", () => {
    expect(Chocolate.tier).toBe(5);
    expect(needsTarget(Chocolate)).toBe(true);
  });

  it("gives the targeted pet +1 experience and nothing else", () => {
    const board: Board = [pet("Ant"), pet("Fish"), null, null, null];
    const result = applyFoodEffect(Chocolate, board, 1, PET_REGISTRY);
    expect(result[1]).toMatchObject({ xp: 1, level: 1, attack: 2, health: 2 });
    expect(result[0]).toMatchObject({ xp: 0 });
    expect(board[1]?.xp).toBe(0);
  });

  it("levels the pet up at 2 xp and again at 5 xp", () => {
    const toL2 = applyFoodEffect(Chocolate, [withXp("Ant", 1), null, null, null, null], 0, PET_REGISTRY);
    expect(toL2[0]).toMatchObject({ xp: 2, level: 2 });
    const toL3 = applyFoodEffect(Chocolate, [withXp("Ant", 4), null, null, null, null], 0, PET_REGISTRY);
    expect(toL3[0]).toMatchObject({ xp: 5, level: 3 });
  });

  it("rejects a level-3 pet as a target", () => {
    const board: Board = [withXp("Ant", 5), pet("Fish"), null, null, null];
    expect(feedError(Chocolate, board, 0)).toMatch(/level 3/i);
    expect(feedError(Chocolate, board, 1)).toBeNull();
    expect(isValidFoodTarget(Chocolate, board[0]!)).toBe(false);
  });

  it("never lets a maxed pet gain xp even if applied directly", () => {
    // The route validates first; applyFoodEffect itself must not overflow.
    const board: Board = [withXp("Ant", 5), null, null, null, null];
    expect(applyFoodEffect(Chocolate, board, 0, PET_REGISTRY)[0]?.xp).toBe(5);
  });

  it("other foods can still target level-3 pets", () => {
    const board: Board = [withXp("Ant", 5), null, null, null, null];
    expect(feedError(Apple, board, 0)).toBeNull();
  });

  it("stocks the level-up reward only when a pet actually levels up", () => {
    const noLevel: Board = [pet("Ant"), null, null, null, null];
    const before = applyFoodLevelUps(
      Chocolate, noLevel, applyFoodEffect(Chocolate, noLevel, 0, PET_REGISTRY),
      emptyShop, 5, PET_REGISTRY, SHOP_PET_POOL
    );
    expect(before.shop.shopPets).toHaveLength(0);

    const levelling: Board = [withXp("Ant", 1), null, null, null, null];
    const after = applyFoodLevelUps(
      Chocolate, levelling, applyFoodEffect(Chocolate, levelling, 0, PET_REGISTRY),
      emptyShop, 5, PET_REGISTRY, SHOP_PET_POOL
    );
    expect(after.shop.shopPets).toHaveLength(2);
  });

  it("fires the level-up ability (Fish buffs friends) on a chocolate level-up", () => {
    const board: Board = [withXp("Fish", 1), pet("Ant"), null, null, null];
    const fed = applyFoodEffect(Chocolate, board, 0, PET_REGISTRY);
    const result = applyFoodLevelUps(Chocolate, board, fed, emptyShop, 5, PET_REGISTRY, SHOP_PET_POOL);
    expect(result.board[1]!.attack).toBeGreaterThan(2);
  });

  it("does nothing for foods without experience", () => {
    const board: Board = [withXp("Ant", 1), null, null, null, null];
    const fed = applyFoodEffect(Apple, board, 0, PET_REGISTRY);
    const result = applyFoodLevelUps(Apple, board, fed, emptyShop, 5, PET_REGISTRY, SHOP_PET_POOL);
    expect(result.shop.shopPets).toHaveLength(0);
    expect(result.board).toBe(fed);
  });
});

describe("random-target xp foods", () => {
  const randomXpFood: FoodType = {
    name: "Test Xp", sprite: "/sap/apple.webp", tier: 5, isPerk: false, isToken: false,
    effect: { experience: 1 }, targeting: { random: 2 }, description: "test",
  };
  const maxed: PetInstance = { ...pet("Ant"), xp: 5, level: 3 };

  it("skips level-3 pets when picking targets", () => {
    const board: Board = [maxed, pet("Fish"), pet("Pig"), null, null];
    for (let i = 0; i < 20; i++) {
      const result = applyFoodEffect(randomXpFood, board, undefined, PET_REGISTRY);
      expect(result[0]?.xp).toBe(5);
      expect(result[1]?.xp).toBe(1);
      expect(result[2]?.xp).toBe(1);
    }
  });

  it("reports no valid pets when every pet is level 3", () => {
    expect(feedError(randomXpFood, [maxed, null, null, null, null], undefined)).not.toBeNull();
  });
});
