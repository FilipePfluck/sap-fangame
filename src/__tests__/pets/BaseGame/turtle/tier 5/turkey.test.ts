import { describe, it, expect } from "vitest";
import { PET_REGISTRY } from "@/lib/pets";
import { makeBoard, makeShop, pet } from "@/__tests__/helpers";
import {
  fireBoardShopAbility,
  fireShopFriendSummoned,
} from "@/lib/game/shop-ability";
import { Trigger } from "@/lib/types";
import { simulateBattle } from "@/lib/game/battle";
import { petToString } from "@/lib/utils/flavor-text";

describe("Turkey", () => {
  it("permanently buffs the summoned pet in the shop", () => {
    const board = makeBoard([pet({ type: "Turkey", level: 2 }), pet()]);
    const summoned = fireShopFriendSummoned(board, 1, PET_REGISTRY);
    const nextTurn = fireBoardShopAbility(
      Trigger.start_of_turn,
      summoned,
      makeShop(),
      PET_REGISTRY
    ).board;

    expect(nextTurn[1]).toMatchObject({ attack: 7, health: 3 });
    expect(nextTurn[1]?.tempAttack).toBeUndefined();
    expect(nextTurn[1]?.tempHealth).toBeUndefined();
  });

  it.each([
    { level: 1, ability: "+3/+1", result: "Zombie Cricket (4/2)" },
    { level: 2, ability: "+6/+2", result: "Zombie Cricket (7/3)" },
    { level: 3, ability: "+9/+3", result: "Zombie Cricket (10/4)" },
  ])(
    "gives the summoned friend $ability at level $level",
    ({ level, result }) => {
      const { steps } = simulateBattle(
        [
          pet({ type: "Cricket",  health: 1 }),
          pet({ type: "Turkey", attack: 3, health: 4, level }),
        ],
        [pet({  health: 10 })],
        PET_REGISTRY
      );

      expect(petToString(steps[1].attackerTeam[0])).toBe(result);
    }
  );

});
