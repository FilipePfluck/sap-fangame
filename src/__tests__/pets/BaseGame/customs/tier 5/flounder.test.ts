import { describe, it, expect } from "vitest";
import { applyFoodEffect } from "@/lib/game/food";
import { fireBoardShopAbility } from "@/lib/game/shop-ability";
import { PET_REGISTRY } from "@/lib/pets";
import { Apple } from "@/lib/foods";
import { HoneyPerk } from "@/lib/perks/honey";
import { ApiBoard, Trigger } from "@/lib/types";
import { EMPTY_SHOP, pet } from "@/__tests__/helpers";

function feedTwice(board: ApiBoard, position: number): ApiBoard {
  const fedOnce = applyFoodEffect(Apple, board, position, PET_REGISTRY);
  return applyFoodEffect(Apple, fedOnce, position, PET_REGISTRY);
}

describe("Flounder", () => {
  it("does not transform after 1 food", () => {
    const board = applyFoodEffect(Apple, [pet({ type: "Flounder" })], 0, PET_REGISTRY);
    expect(board[0]?.type).toBe("Flounder");
  });

  it("transforms into an Adult Flounder after 2 food", () => {
    const board = feedTwice([pet({ type: "Flounder" })], 0);
    expect(board[0]?.type).toBe("Adult Flounder");
  });

  it("keeps its stats on transform", () => {
    const board = feedTwice([pet({ type: "Flounder", attack: 2, health: 4 })], 0);
    expect(board[0]).toMatchObject({ attack: 4, health: 6 });
  });

  it("keeps its perk on transform", () => {
    const board = feedTwice([pet({ type: "Flounder", perk: HoneyPerk })], 0);
    expect(board[0]?.perk).toEqual(HoneyPerk);
  });

  it("keeps its level but not its leftover experience", () => {
    const board = feedTwice([pet({ type: "Flounder", level: 2, xp: 3 })], 0);
    expect(board[0]).toMatchObject({ type: "Adult Flounder", level: 2, xp: 2 });
  });

  it.each([
    { level: 1, expected: { xp: 1, level: 1, attack: 2, health: 2 } },
    { level: 2, expected: { xp: 2, level: 2, attack: 3, health: 3 } },
    { level: 3, expected: { xp: 3, level: 2, attack: 4, health: 4 } },
  ])("gives $level XP to the two back-most friends", ({ level, expected }) => {
    const board = feedTwice(
      [pet({ type: "Ant" }), pet({ type: "Flounder", level }), pet({ type: "Fish" }), pet({ type: "Duck" }), null],
      1
    );
    expect(board[0]).toMatchObject({ xp: 0, attack: 1, health: 1 });
    expect(board[2]).toMatchObject(expected);
    expect(board[3]).toMatchObject(expected);
  });

  it("does not count food eaten by friends", () => {
    let board: ApiBoard = [pet({ type: "Ant" }), pet({ type: "Flounder" })];
    board = applyFoodEffect(Apple, board, 0, PET_REGISTRY);
    board = applyFoodEffect(Apple, board, 1, PET_REGISTRY);
    expect(board[1]?.type).toBe("Flounder");
  });

  it("resets its food count at start of turn", () => {
    let board: ApiBoard = [pet({ type: "Flounder" })];
    board = applyFoodEffect(Apple, board, 0, PET_REGISTRY);
    board = fireBoardShopAbility(
      Trigger.start_of_turn,
      board,
      EMPTY_SHOP,
      PET_REGISTRY
    ).board;
    board = applyFoodEffect(Apple, board, 0, PET_REGISTRY);
    expect(board[0]?.type).toBe("Flounder");
  });
});
