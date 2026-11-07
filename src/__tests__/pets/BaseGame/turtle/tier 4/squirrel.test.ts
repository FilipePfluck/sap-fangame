import { describe, it, expect } from "vitest";
import { PET_REGISTRY } from "@/lib/pets";
import { makeBoard, makeShop, pet } from "@/__tests__/helpers";
import { fireBoardShopAbility } from "@/lib/game/shop-ability";
import { Trigger } from "@/lib/types";
import { getFoodCost } from "@/lib/game/costs";
import { FOOD_REGISTRY } from "@/lib/foods";

describe("Squirrel", () => {
  it.each([{ level: 1 }, { level: 2 }, { level: 3 }])(
    "discounts all shop food by $level gold at level $level",
    ({ level }) => {
      const board = makeBoard([pet({ type: "Squirrel", level })]);
      const shop = makeShop([], ["Apple", "Pear"]);
      const { shop: result } = fireBoardShopAbility(
        Trigger.start_of_turn,
        board,
        shop,
        PET_REGISTRY
      );

      const shopDiscounts = result.shopFoods.map((food) => food.discount);
      expect(shopDiscounts).toEqual([level, level]);
    }
  );

  it("does not discount shop pets", () => {
    const board = makeBoard([pet({ type: "Squirrel" })]);
    const shop = makeShop(["Ant"]);
    const { shop: result } = fireBoardShopAbility(
      Trigger.start_of_turn,
      board,
      shop,
      PET_REGISTRY
    );
    expect(result.shopPets[0].discount).toBeUndefined();
  });

  it("stacks with a second Squirrel", () => {
    const board = makeBoard([
      pet({ type: "Squirrel" }),
      pet({ type: "Squirrel" }),
    ]);
    const { shop: result } = fireBoardShopAbility(
      Trigger.start_of_turn,
      board,
      makeShop([], ["Apple"]),
      PET_REGISTRY
    );
    expect(result.shopFoods[0].discount).toBe(2);
  });

  it("does not make food cheaper than 0", () => {
    const board = makeBoard([pet({ type: "Squirrel", level: 2 })]);
    const { shop } = fireBoardShopAbility(
      Trigger.start_of_turn,
      board,
      makeShop([], ["Apple", "Pill"]),
      PET_REGISTRY
    );

    expect(getFoodCost(shop.shopFoods[0], FOOD_REGISTRY["Apple"])).toBe(1);
    expect(getFoodCost(shop.shopFoods[1], FOOD_REGISTRY["Pill"])).toBe(0);
  });

  it("does not mutate the shop it was given", () => {
    const shop = makeShop([], ["Apple"]);
    fireBoardShopAbility(
      Trigger.start_of_turn,
      makeBoard([pet({ type: "Squirrel" })]),
      shop,
      PET_REGISTRY
    );
    expect(shop.shopFoods[0].discount).toBeUndefined();
  });

  it("has no effect when there is no Squirrel", () => {
    const board = makeBoard([pet({ type: "Swan" })]);
    const { shop } = fireBoardShopAbility(
      Trigger.start_of_turn,
      board,
      makeShop([], ["Apple"]),
      PET_REGISTRY
    );
    expect(shop.shopFoods[0].discount).toBeUndefined();
  });
});
