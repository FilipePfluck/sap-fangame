import { describe, it, expect } from "vitest";
import { PET_REGISTRY } from "@/lib/pets";
import { makeBoard, makeShop, pet } from "@/__tests__/helpers";
import { fireBoardShopAbility } from "@/lib/game/shop-ability";
import { Trigger } from "@/lib/types";

describe("Monkey", () => {
  it.each([
    { level: 1, buff: 2, expected: 3 },
    { level: 2, buff: 4, expected: 5 },
    { level: 3, buff: 6, expected: 7 },
  ])(
    "gives the front-most pet, including itself, +$buff/+$buff at level $level",
    ({ level, expected }) => {
      const board = makeBoard([pet({ type: "Monkey", level }), pet()]);
      const { board: result } = fireBoardShopAbility(
        Trigger.end_turn,
        board,
        makeShop(),
        PET_REGISTRY
      );

      expect(result[0]).toMatchObject({ attack: expected, health: expected });
      expect(result[1]).toMatchObject({ attack: 1, health: 1 });
    }
  );
});
