import { describe, it, expect } from "vitest";
import { applyFoodEffect } from "@/lib/game/food";
import { fireBoardShopAbility } from "@/lib/game/shop-ability";
import { getFoodCost } from "@/lib/game/costs";
import { PET_REGISTRY } from "@/lib/pets";
import { Cupcake } from "@/lib/foods/cupcake";
import { ApiBoard, Trigger } from "@/lib/types";
import { EMPTY_SHOP, pet } from "./helpers";

function startTurn(board: ApiBoard) {
  return fireBoardShopAbility(Trigger.start_of_turn, board, EMPTY_SHOP, PET_REGISTRY);
}

describe("Sugar Glider", () => {
  it.each([
    { level: 1, multiplier: undefined },
    { level: 2, multiplier: 2 },
    { level: 3, multiplier: 3 },
  ])("stocks a Cupcake at level $level", ({ level, multiplier }) => {
    const { shop } = startTurn([pet({ type: "Sugar Glider", level })]);
    expect(shop.shopFoods).toEqual([
      { type: "Cupcake", frozen: false, discount: 3, multiplier },
    ]);
  });

  it("stocks the Cupcake for free", () => {
    const { shop } = startTurn([pet({ type: "Sugar Glider" })]);
    expect(getFoodCost(shop.shopFoods[0], Cupcake)).toBe(0);
  });

  it("multiplies the Cupcake's temporary stats", () => {
    const board: ApiBoard = [pet({ type: "Ant" })];
    const result = applyFoodEffect(Cupcake, board, 0, PET_REGISTRY, 3);
    expect(result[0]).toMatchObject({
      attack: 10,
      health: 10,
      tempAttack: 9,
      tempHealth: 9,
    });
  });

  it("adds Cat's level to the food's multiplier", () => {
    // Level 2 Cupcake (2x) + level 1 Cat (+1) = 3x.
    const board: ApiBoard = [pet({ type: "Ant" }), pet({ type: "Cat" })];
    const result = applyFoodEffect(Cupcake, board, 0, PET_REGISTRY, 2);
    expect(result[0]).toMatchObject({ attack: 10, health: 10 });
  });
});
