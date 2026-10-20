import { describe, it, expect } from "vitest";
import { applyFoodEffect } from "@/lib/game/food";
import {
  fireBoardShopAbility,
  resolveExperienceLevelUps,
} from "@/lib/game/shop-ability";
import { PET_REGISTRY, SHOP_PET_POOL } from "@/lib/pets";
import { Apple } from "@/lib/foods";
import { Chocolate } from "@/lib/foods/chocolate";
import { HoneyPerk } from "@/lib/perks/honey";
import { ApiBoard, PetInstance, Trigger } from "@/lib/types";

function pet(
  type: string,
  attack = 2,
  health = 2,
  level = 1,
  xp = 0
): PetInstance {
  return { type, attack, health, perk: null, xp, level };
}

const emptyShop = { shopPets: [], shopFoods: [] };
const OPTIONS = { turn: 3, rewardPool: SHOP_PET_POOL, petRegistry: PET_REGISTRY };

describe("Flounder", () => {
  it("transforms in place on its 2nd food and gifts the two back-most friends", () => {
    const flounder = { ...pet("Flounder", 2, 4), perk: { ...HoneyPerk } };
    let board: ApiBoard = [pet("Ant"), flounder, pet("Fish"), pet("Duck"), null];
    board = applyFoodEffect(Apple, board, 1, PET_REGISTRY);
    expect(board[1]?.type).toBe("Flounder");

    board = applyFoodEffect(Apple, board, 1, PET_REGISTRY);
    expect(board[1]).toMatchObject({
      type: "Adult Flounder",
      attack: 4,
      health: 6,
      level: 1,
      perk: HoneyPerk,
    });
    expect(board[0]).toMatchObject({ xp: 0 });
    expect(board[2]).toMatchObject({ xp: 1, attack: 3, health: 3 });
    expect(board[3]).toMatchObject({ xp: 1, attack: 3, health: 3 });
  });

  it("keeps its level but not its leftover experience", () => {
    let board: ApiBoard = [pet("Flounder", 2, 4, 2, 3)];
    board = applyFoodEffect(Apple, board, 0, PET_REGISTRY);
    board = applyFoodEffect(Apple, board, 0, PET_REGISTRY);
    expect(board[0]).toMatchObject({ type: "Adult Flounder", level: 2, xp: 2 });
  });

  it("only counts food it eats itself, and the count resets each turn", () => {
    let board: ApiBoard = [pet("Ant"), pet("Flounder", 2, 4)];
    board = applyFoodEffect(Apple, board, 0, PET_REGISTRY);
    board = applyFoodEffect(Apple, board, 1, PET_REGISTRY);
    board = fireBoardShopAbility(
      Trigger.start_of_turn,
      board,
      emptyShop,
      PET_REGISTRY
    ).board;
    board = applyFoodEffect(Apple, board, 1, PET_REGISTRY);
    expect(board[1]?.type).toBe("Flounder");
  });
});

describe("resolveExperienceLevelUps", () => {
  it("stocks a level-up reward when food experience levels a pet up", () => {
    const before: ApiBoard = [pet("Ant", 2, 2, 1, 1)];
    const after = applyFoodEffect(Chocolate, before, 0, PET_REGISTRY);
    const { shop } = resolveExperienceLevelUps(before, after, emptyShop, OPTIONS);
    expect(shop.shopPets.length).toBeGreaterThan(0);
  });

  it("stocks nothing without a level-up", () => {
    const before: ApiBoard = [pet("Ant")];
    const after = applyFoodEffect(Chocolate, before, 0, PET_REGISTRY);
    const { shop } = resolveExperienceLevelUps(before, after, emptyShop, OPTIONS);
    expect(shop.shopPets).toEqual([]);
  });
});
