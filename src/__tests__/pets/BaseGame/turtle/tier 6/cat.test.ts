import { describe, it, expect } from "vitest";
import { applyFoodEffect } from "@/lib/game/food";
import { fireBoardShopAbility } from "@/lib/game/shop-ability";
import { PET_REGISTRY } from "@/lib/pets";
import { Apple, Sushi } from "@/lib/foods";
import { Chocolate } from "@/lib/foods/chocolate";
import { MeatBone } from "@/lib/foods/meat-bone";
import { ApiBoard, Trigger } from "@/lib/types";
import { EMPTY_SHOP, pet } from "@/__tests__/helpers";

describe("Cat", () => {
  it.each([
    { level: 1, expected: 3 },
    { level: 2, expected: 4 },
    { level: 3, expected: 5 },
  ])("multiplies shop food stats at level $level", ({ level, expected }) => {
    const board: ApiBoard = [pet({ type: "Ant" }), pet({ type: "Cat", level })];
    const result = applyFoodEffect(Apple, board, 0, PET_REGISTRY);
    expect(result[0]).toMatchObject({ attack: expected, health: expected });
  });

  it("stacks levels across Cats", () => {
    const board: ApiBoard = [
      pet({ type: "Ant" }),
      pet({ type: "Cat", level: 1 }),
      pet({ type: "Cat", level: 3 }),
    ];
    const result = applyFoodEffect(Apple, board, 0, PET_REGISTRY);
    expect(result[0]).toMatchObject({ attack: 6, health: 6 });
  });

  it("works 2 times per turn", () => {
    let board: ApiBoard = [pet({ type: "Ant" }), pet({ type: "Cat" })];
    for (let i = 0; i < 3; i++) {
      board = applyFoodEffect(Apple, board, 0, PET_REGISTRY);
    }
    expect(board[0]).toMatchObject({ attack: 6, health: 6 });
  });

  it("resets its uses at start of turn", () => {
    let board: ApiBoard = [
      pet({ type: "Ant" }),
      pet({ type: "Cat", triggerCountsThisTurn: { [Trigger.food_bought]: 2 } }),
    ];
    board = fireBoardShopAbility(
      Trigger.start_of_turn,
      board,
      EMPTY_SHOP,
      PET_REGISTRY
    ).board;
    board = applyFoodEffect(Apple, board, 0, PET_REGISTRY);
    expect(board[0]).toMatchObject({ attack: 3, health: 3 });
  });

  it("multiplies every pet Sushi feeds", () => {
    const board: ApiBoard = [pet({ type: "Ant" }), pet({ type: "Fish" }), pet({ type: "Cat" })];
    const result = applyFoodEffect(Sushi, board, undefined, PET_REGISTRY);
    expect(result[0]).toMatchObject({ attack: 3, health: 3 });
    expect(result[1]).toMatchObject({ attack: 3, health: 3 });
  });

  it("spends one use on Sushi", () => {
    const board: ApiBoard = [pet({ type: "Ant" }), pet({ type: "Fish" }), pet({ type: "Cat" })];
    const result = applyFoodEffect(Sushi, board, undefined, PET_REGISTRY);
    expect(result[2]?.triggerCountsThisTurn).toEqual({ [Trigger.food_bought]: 1 });
  });

  it("does not multiply Chocolate", () => {
    const board: ApiBoard = [pet({ type: "Ant" }), pet({ type: "Cat" })];
    const result = applyFoodEffect(Chocolate, board, 0, PET_REGISTRY);
    expect(result[0]).toMatchObject({ attack: 2, health: 2, xp: 1 });
  });

  it.each([
    { food: Chocolate, name: "Chocolate" },
    { food: MeatBone, name: "Meat Bone" },
  ])("spends no use on $name", ({ food }) => {
    const board: ApiBoard = [pet({ type: "Ant" }), pet({ type: "Cat" })];
    const result = applyFoodEffect(food, board, 0, PET_REGISTRY);
    expect(result[1]?.triggerCountsThisTurn).toBeUndefined();
  });

  // TODO - Nothing feeds food outside the shop yet (in battle or from other pets)
  it.skip("does not multiply food that wasn't bought from the shop", () => {});
});
