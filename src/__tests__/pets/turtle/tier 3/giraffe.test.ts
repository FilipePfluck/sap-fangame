import { describe, it, expect } from "vitest";
import { PET_REGISTRY } from "@/lib/pets";
import { makeBoard, makeShop, pet } from "@/__tests__/helpers";
import { fireBoardShopAbility } from "@/lib/game/shop-ability";
import { Trigger } from "@/lib/types";

describe("Giraffe", () => {
  it.each([
    { level: 1, expected: 2 },
    { level: 2, expected: 3 },
    { level: 3, expected: 4 },
  ])(
    "gives the nearest friend ahead +$level/+$level at level $level",
    ({ level, expected }) => {
      const board = makeBoard([pet(), pet({ type: "Giraffe", level })]);
      const { board: result } = fireBoardShopAbility(
        Trigger.start_of_turn,
        board,
        makeShop(),
        PET_REGISTRY
      );

      expect(result[0]).toMatchObject({ attack: expected, health: expected });
    }
  );

  it("buffs only the nearest friend ahead", () => {
    const board = makeBoard([pet(), pet(), pet({ type: "Giraffe", level: 3 })]);
    const { board: result } = fireBoardShopAbility(
      Trigger.start_of_turn,
      board,
      makeShop(),
      PET_REGISTRY
    );

    expect(result[1]).toMatchObject({ attack: 4, health: 4 });
    expect(result[0]).toMatchObject({ attack: 1, health: 1 });
  });

  it("does not buff a friend behind", () => {
    const board = makeBoard([pet({ type: "Giraffe" }), pet()]);
    const { board: result } = fireBoardShopAbility(
      Trigger.start_of_turn,
      board,
      makeShop(),
      PET_REGISTRY
    );

    expect(result[1]).toMatchObject({ attack: 1, health: 1 });
  });
});
