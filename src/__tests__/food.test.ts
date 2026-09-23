import { describe, it, expect } from "vitest";
import { applyFoodEffect, feedError, needsTarget } from "@/lib/game/food";
import { PET_REGISTRY } from "@/lib/pets";
import { Apple, Honey, Pill, Sushi } from "@/lib/foods";
import type { Board, FoodType, PetInstance } from "@/lib/types";
import { MeatBone } from "@/lib/foods/meat-bone";
import { MeatBonePerk } from "@/lib/perks/meat-bone";
import { HoneyPerk } from "@/lib/perks/honey";

function pet(type: string, attack = 2, health = 2): PetInstance {
  return { type, attack, health, perk: null, xp: 1, level: 1 };
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
    expect(result[0]?.perk).toBe(HoneyPerk);
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
    const perkFood: FoodType = { ...MeatBone, targeting: { random: 2 } };
    const board: Board = [pet("Ant"), pet("Fish"), pet("Pig"), null, null];
    const result = applyFoodEffect(perkFood, board, 0, PET_REGISTRY);
    expect(result.filter((p) => p?.perk === MeatBonePerk)).toHaveLength(2);
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
