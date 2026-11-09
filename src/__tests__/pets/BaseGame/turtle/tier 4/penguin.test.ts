import { describe, it, expect } from "vitest";
import { PET_REGISTRY } from "@/lib/pets";
import { makeBoard, makeShop, pet } from "@/__tests__/helpers";
import { fireBoardShopAbility } from "@/lib/game/shop-ability";
import { PetData, Trigger } from "@/lib/types";

describe("Penguin", () => {
  it.each([
    { level: 1, expected: 2 },
    { level: 2, expected: 3 },
    { level: 3, expected: 4 },
  ])(
    "buffs two level 2+ friends by +$level/+$level at level $level",
    ({ level, expected }) => {
      const board = makeBoard([
        pet({ type: "Penguin", level }),
        pet({ level: 2 }),
        pet({ level: 3 }),
      ]);
      const { board: result } = fireBoardShopAbility(
        Trigger.start_of_turn,
        board,
        makeShop(),
        PET_REGISTRY
      );

      expect(result[1]).toMatchObject({ attack: expected, health: expected });
      expect(result[2]).toMatchObject({ attack: expected, health: expected });
    }
  );

  it("buffs at most two eligible friends", () => {
    const board = makeBoard([
      pet({ type: "Penguin" }),
      pet({ level: 2 }),
      pet({ level: 2 }),
      pet({ level: 2 }),
    ]);
    const { board: result } = fireBoardShopAbility(
      Trigger.start_of_turn,
      board,
      makeShop(),
      PET_REGISTRY
    );

    const friends = result.slice(1, 4) as PetData[];
    expect(friends.reduce((sum, friend) => sum + friend.attack, 0)).toBe(5);
    expect(friends.reduce((sum, friend) => sum + friend.health, 0)).toBe(5);
  });

  it("never buffs level 1 friends", () => {
    const board = makeBoard([pet({ type: "Penguin" }), pet({ level: 1 })]);
    const { board: result } = fireBoardShopAbility(
      Trigger.start_of_turn,
      board,
      makeShop(),
      PET_REGISTRY
    );

    expect(result[1]).toMatchObject({ attack: 1, health: 1 });
  });

  it("never buffs itself", () => {
    const board = makeBoard([pet({ type: "Penguin", level: 2 })]);
    const { board: result } = fireBoardShopAbility(
      Trigger.start_of_turn,
      board,
      makeShop(),
      PET_REGISTRY
    );

    expect(result[0]).toMatchObject({ attack: 1, health: 1 });
  });
});
