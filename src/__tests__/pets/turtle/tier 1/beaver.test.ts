import { describe, it, expect } from "vitest";
import { PET_REGISTRY } from "@/lib/pets";
import { makeBoard, makeShop, pet } from "@/__tests__/helpers";
import { fireShopAbility } from "@/lib/game/shop-ability";
import { PetData, Trigger } from "@/lib/types";

describe("Beaver", () => {
  // TODO - Doesn't require ability to be random to pass
  it.each([
    { level: 1, expectedAtkDifference: 2 },
    { level: 2, expectedAtkDifference: 4 },
    { level: 3, expectedAtkDifference: 6 },
  ])(
    "gives $level attack to 2 random friends at level $level",
    ({ level, expectedAtkDifference }) => {
      const beaver = pet({ type: "Beaver", level });
      const board = makeBoard([beaver, pet(), pet(), pet(), pet()]);

      const initialAttack = board
        .map((pet) => pet!.attack)
        .reduce((sum = 0, atk) => sum + atk);

      const { board: result } = fireShopAbility(
        Trigger.sell,
        beaver,
        0,
        board,
        makeShop(),
        PET_REGISTRY
      );

      const finalAttack = result
        .map((pet) => pet!.attack)
        .reduce((sum = 0, atk) => sum + atk);

      expect(finalAttack - initialAttack).toBe(expectedAtkDifference);
    }
  );

  it("buffs only available friend when only one exists", () => {
    const beaver = pet({ type: "Beaver" });
    const sloth = pet();
    const board = makeBoard([beaver, sloth]);

    const { board: result } = fireShopAbility(
      Trigger.sell,
      beaver,
      0,
      board,
      makeShop(),
      PET_REGISTRY
    );
    expect((result[1] as PetData).attack).toBe(2);
  });

  it("no-op when no friends on board", () => {
    const beaver = pet({ type: "Beaver" });
    const board = makeBoard([beaver]);

    const { board: result } = fireShopAbility(
      Trigger.sell,
      beaver,
      0,
      board,
      makeShop(),
      PET_REGISTRY
    );
    expect(result[0]).toEqual(beaver); // unchanged
  });
});
