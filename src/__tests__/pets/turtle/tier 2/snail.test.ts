import { describe, it, expect } from "vitest";
import { PET_REGISTRY } from "@/lib/pets";
import { makeBoard, makeShop, pet } from "@/__tests__/helpers";
import { fireBoardShopAbility } from "@/lib/game/shop-ability";
import { PetData, Trigger } from "@/lib/types";

describe("Snail", () => {
  it.each([
    { level: 1, expected: 2 },
    { level: 2, expected: 3 },
    { level: 3, expected: 4 },
  ])(
    "gives 3 nearest friends ahead +$level attack at level $level after a loss",
    ({ level, expected }) => {
      const friends = [pet(), pet(), pet(), pet()];
      const snail = pet({ type: "Snail", level });
      const board = makeBoard([...friends, snail]);
      const { board: result } = fireBoardShopAbility(
        Trigger.end_turn,
        board,
        makeShop(),
        PET_REGISTRY,
        "LOSS"
      );

      expect((result[0] as PetData).attack).toBe(1);
      expect((result[1] as PetData).attack).toBe(expected);
      expect((result[2] as PetData).attack).toBe(expected);
      expect((result[3] as PetData).attack).toBe(expected);
    }
  );

  it("no-op when the last battle was not a loss", () => {
    const friend = pet();
    const snail = pet({ type: "Snail" });
    const board = makeBoard([friend, snail]);
    const { board: result } = fireBoardShopAbility(
      Trigger.end_turn,
      board,
      makeShop(),
      PET_REGISTRY,
      "WIN"
    );
    expect((result[0] as PetData).attack).toBe(1);
  });

  it("buffs only the friends that exist when fewer than 3 are ahead", () => {
    const friend = pet();
    const snail = pet({ type: "Snail" });
    const board = makeBoard([friend, snail]);
    const { board: result } = fireBoardShopAbility(
      Trigger.end_turn,
      board,
      makeShop(),
      PET_REGISTRY,
      "LOSS"
    );
    expect((result[0] as PetData).attack).toBe(2);
  });
});
