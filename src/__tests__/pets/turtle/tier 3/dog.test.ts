import { describe, it, expect } from "vitest";
import { PET_REGISTRY } from "@/lib/pets";
import { makeBoard, makeShop, pet } from "@/__tests__/helpers";
import { fireBoardShopAbility, fireShopFriendSummoned } from "@/lib/game/shop-ability";
import { Trigger } from "@/lib/types";
import { simulateBattle } from "@/lib/game/battle";
import { petToString } from "@/lib/utils/flavor-text";

describe("Dog", () => {
  it("gains temporary stats in shop until the next turn", () => {
    const board = makeBoard([pet({ type: "Dog", level: 2 }), pet()]);
    const summoned = fireShopFriendSummoned(board, 1, PET_REGISTRY);

    expect(summoned[0]).toMatchObject({
      attack: 5,
      health: 3,
      tempAttack: 4,
      tempHealth: 2,
    });

    const nextTurn = fireBoardShopAbility(
      Trigger.start_of_turn,
      summoned,
      makeShop(),
      PET_REGISTRY
    ).board;
    expect(nextTurn[0]).toMatchObject({ health: 1 });
    expect(nextTurn[0]?.tempAttack).toBeUndefined();
    expect(nextTurn[0]?.tempHealth).toBeUndefined();
  });

  it.each([
    { level: 1, ability: "+2/+1", result: "Dog (5/3)" },
    { level: 2, ability: "+4/+2", result: "Dog (7/4)" },
    { level: 3, ability: "+6/+3", result: "Dog (9/5)" },
  ])(
    "gains $ability when a friend is summoned at level $level",
    ({ level, result }) => {
      const { steps } = simulateBattle(
        [
          pet({ type: "Cricket",  health: 1 }),
          pet({ type: "Dog", attack: 3, health: 2, level }),
        ],
        [pet({  health: 10 })],
        PET_REGISTRY
      );

      expect(petToString(steps[1].attackerTeam[1])).toBe(result);
    }
  );
});
