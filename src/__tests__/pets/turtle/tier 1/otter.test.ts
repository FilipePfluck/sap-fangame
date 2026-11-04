import { describe, it, expect } from "vitest";
import { PET_REGISTRY } from "@/lib/pets";
import { makeBoard, makeShop, pet } from "@/__tests__/helpers";
import { fireShopAbility } from "@/lib/game/shop-ability";
import { ApiBoard, PetInstance, Trigger } from "@/lib/types";

describe("Otter", () => {
  // TODO - Doesn't require ability to be random to pass
  it.each([
    { level: 1, expectedHpDifference: 1 },
    { level: 2, expectedHpDifference: 2 },
    { level: 3, expectedHpDifference: 3 },
  ])(
    "gives +1 health to $level random friend at level $level",
    ({ level, expectedHpDifference }) => {
      const otter = pet({ type: "Otter", level });
      const board: ApiBoard = [otter, pet(), pet(), pet(), pet()];

      const initialTotalHealth = board
        .map((pet) => pet!.health)
        .reduce((sum = 0, hp) => sum + hp);

      const { board: result } = fireShopAbility(
        Trigger.buy,
        otter,
        0,
        board,
        makeShop(),
        PET_REGISTRY
      );

      const finalTotalHealth = result
        .map((pet) => pet!.health)
        .reduce((sum = 0, hp) => sum + hp);

      expect(expectedHpDifference).toBe(finalTotalHealth - initialTotalHealth);
    }
  );

  it("no-op when no friends on board", () => {
    const otter = pet({ type: "Otter" });
    const board = makeBoard([otter]);

    const { board: result } = fireShopAbility(
      Trigger.buy,
      otter,
      0,
      board,
      makeShop(),
      PET_REGISTRY
    );
    expect((result[0] as PetInstance).health).toBe(1); // Otter unchanged
  });
});
