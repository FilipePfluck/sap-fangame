import { describe, it, expect } from "vitest";
import { PET_REGISTRY } from "@/lib/pets";
import { makeBoard, makeShop, pet } from "@/__tests__/helpers";
import { fireBoardShopAbility } from "@/lib/game/shop-ability";
import { Trigger } from "@/lib/types";
import { getFoodCost } from "@/lib/game/costs";
import { FOOD_REGISTRY } from "@/lib/foods";

describe("Worm", () => {
  it.each([
    { level: 1, food: "Apple" },
    { level: 2, food: "Better Apple" },
    { level: 3, food: "Best Apple" },
  ])("stocks one 2-gold $food at level $level", ({ level, food }) => {
    const { shop } = fireBoardShopAbility(
      Trigger.start_of_turn,
      makeBoard([pet({ type: "Worm", level })]),
      makeShop(),
      PET_REGISTRY
    );
    const stockedFood = shop.shopFoods[0];

    expect(stockedFood).toMatchObject({ type: food, discount: 1 });
    expect(getFoodCost(stockedFood, FOOD_REGISTRY[food])).toBe(2);
  });
});
