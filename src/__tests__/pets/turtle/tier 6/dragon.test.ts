import { describe, it, expect } from "vitest";
import { PET_REGISTRY } from "@/lib/pets";
import { makeBoard, makeShop, pet } from "@/__tests__/helpers";
import {
  fireBoardShopAbility,
  fireShopFriendBought,
} from "@/lib/game/shop-ability";
import { Trigger } from "@/lib/types";

describe("Dragon", () => {
  it.each([
    { level: 1, expected: 2 },
    { level: 2, expected: 3 },
    { level: 3, expected: 4 },
  ])("gives friends +$level/+$level at level $level", ({ level, expected }) => {
    const board = makeBoard([pet({ type: "Dragon", level }), pet()]);
    const { board: result } = fireShopFriendBought(
      PET_REGISTRY.Sloth,
      board,
      makeShop(),
      PET_REGISTRY
    );

    expect(result[1]).toMatchObject({ attack: expected, health: expected });
    expect(result[0]).toMatchObject({ attack: 1, health: 1 });
  });

  it("works at most four times per turn", () => {
    const shop = makeShop();
    let board = makeBoard([pet({ type: "Dragon" }), pet()]);
    for (let i = 0; i < 4; i++) {
      board = fireShopFriendBought(
        PET_REGISTRY.Sloth,
        board,
        shop,
        PET_REGISTRY
      ).board;
    }
    expect(board[1]).toMatchObject({ attack: 5, health: 5 });
    expect(board[0]?.triggerCountsThisTurn).toEqual({
      [Trigger.friend_bought]: 4,
    });

    board = fireShopFriendBought(
      PET_REGISTRY.Sloth,
      board,
      shop,
      PET_REGISTRY
    ).board;
    expect(board[1]).toMatchObject({ attack: 5, health: 5 });
  });

  it("no-ops for buying non-tier 1 pets", () => {
    const board = makeBoard([pet({ type: "Dragon" }), pet()]);
    expect(board[1]).toMatchObject({ attack: 1, health: 1 });

    const { board: result } = fireShopFriendBought(
      PET_REGISTRY.Hedgehog,
      board,
      makeShop(),
      PET_REGISTRY
    );
    expect(result[1]).toMatchObject({ attack: 1, health: 1 });
  });

  it("resets the four-per-turn limit at start of turn", () => {
    const shop = makeShop();
    let board = makeBoard([pet({ type: "Dragon" }), pet()]);
    for (let i = 0; i < 4; i++) {
      board = fireShopFriendBought(
        PET_REGISTRY.Sloth,
        board,
        shop,
        PET_REGISTRY
      ).board;
    }
    expect(board[1]).toMatchObject({ attack: 5, health: 5 });

    board = fireBoardShopAbility(
      Trigger.start_of_turn,
      board,
      shop,
      PET_REGISTRY
    ).board;
    board = fireShopFriendBought(
      PET_REGISTRY.Sloth,
      board,
      shop,
      PET_REGISTRY
    ).board;
    expect(board[1]).toMatchObject({ attack: 6, health: 6 });
  });
});
