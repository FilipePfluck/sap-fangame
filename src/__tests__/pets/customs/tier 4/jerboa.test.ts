import { describe, it, expect } from "vitest";
import { PET_REGISTRY } from "@/lib/pets";
import { makeBoard, pet } from "@/__tests__/helpers";
import { applyFoodEffect } from "@/lib/game/food";
import { Apple, BestApple, BetterApple, Cupcake } from "@/lib/foods";

describe("Jerboa", () => {
  it.each([
    { level: 1, expected: 2 },
    { level: 2, expected: 3 },
    { level: 3, expected: 4 },
  ])("gives friends +$level/+$level at level $level", ({ level, expected }) => {
    const result = applyFoodEffect(
      Apple,
      makeBoard([pet({ type: "Jerboa", level }), pet()]),
      0,
      PET_REGISTRY
    );

    expect(result[1]).toMatchObject({ attack: expected, health: expected });
  });

  it.each([{ food: Apple }, { food: BetterApple }, { food: BestApple }])(
    "activates when it eats $food.name",
    ({ food }) => {
      const result = applyFoodEffect(
        food,
        makeBoard([pet({ type: "Jerboa" }), pet()]),
        0,
        PET_REGISTRY
      );

      expect(result[1]).toMatchObject({ attack: 2, health: 2 });
    }
  );

  it("triggers only once per turn and ignores non-Apple foods", () => {
    let board = makeBoard([pet({ type: "Jerboa" }), pet()]);
    board = applyFoodEffect(Cupcake, board, 0, PET_REGISTRY);
    expect(board[1]).toMatchObject({ attack: 1, health: 1 });

    board = applyFoodEffect(Apple, board, 0, PET_REGISTRY);
    board = applyFoodEffect(Apple, board, 0, PET_REGISTRY);

    expect(board[1]).toMatchObject({ attack: 2, health: 2 });
  });
});
