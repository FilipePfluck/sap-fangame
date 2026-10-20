import { describe, it, expect } from "vitest";
import { applyFoodEffect } from "@/lib/game/food";
import { fireBoardShopAbility } from "@/lib/game/shop-ability";
import { PET_REGISTRY } from "@/lib/pets";
import { Apple, Sushi } from "@/lib/foods";
import { Chocolate } from "@/lib/foods/chocolate";
import { MeatBone } from "@/lib/foods/meat-bone";
import { ApiBoard, PetInstance, Trigger } from "@/lib/types";

function pet(type: string, attack = 2, health = 2, level = 1): PetInstance {
  return { type, attack, health, perk: null, xp: 0, level };
}

describe("Cat", () => {
  it("stacks levels across Cats (level 1 + level 3 gives 5x)", () => {
    const board: ApiBoard = [
      pet("Ant"),
      pet("Cat", 4, 5, 1),
      pet("Cat", 4, 5, 3),
    ];
    const result = applyFoodEffect(Apple, board, 0, PET_REGISTRY);
    expect(result[0]).toMatchObject({ attack: 7, health: 7 });
  });

  it("works 2 times per turn, then resets at start of turn", () => {
    let board: ApiBoard = [pet("Ant"), pet("Cat", 4, 5)];
    for (let i = 0; i < 3; i++) {
      board = applyFoodEffect(Apple, board, 0, PET_REGISTRY);
    }
    expect(board[0]).toMatchObject({ attack: 7, health: 7 });

    board = fireBoardShopAbility(
      Trigger.start_of_turn,
      board,
      { shopPets: [], shopFoods: [] },
      PET_REGISTRY
    ).board;
    board = applyFoodEffect(Apple, board, 0, PET_REGISTRY);
    expect(board[0]).toMatchObject({ attack: 9, health: 9 });
  });

  it("spends one use on Sushi but multiplies every target", () => {
    let board: ApiBoard = [pet("Ant"), pet("Fish"), pet("Cat", 4, 5)];
    board = applyFoodEffect(Sushi, board, undefined, PET_REGISTRY);
    expect(board[0]).toMatchObject({ attack: 4, health: 4 });
    expect(board[1]).toMatchObject({ attack: 4, health: 4 });

    board = applyFoodEffect(Apple, board, 0, PET_REGISTRY);
    expect(board[0]).toMatchObject({ attack: 6, health: 6 });
  });

  it("ignores Chocolate and perk foods without spending a use", () => {
    let board: ApiBoard = [pet("Ant"), pet("Cat", 4, 5)];
    board = applyFoodEffect(Chocolate, board, 0, PET_REGISTRY);
    board = applyFoodEffect(MeatBone, board, 0, PET_REGISTRY);
    // Chocolate's level-up +1/+1 is not multiplied.
    expect(board[0]).toMatchObject({ attack: 3, health: 3 });
    expect(board[1]?.triggerCountsThisTurn).toBeUndefined();
  });
});
