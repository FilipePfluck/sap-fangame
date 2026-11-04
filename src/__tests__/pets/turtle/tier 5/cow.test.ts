import { describe, it, expect } from "vitest";
import { PET_REGISTRY } from "@/lib/pets";
import { makeBoard, makeShop, pet } from "@/__tests__/helpers";
import { fireShopAbility } from "@/lib/game/shop-ability";
import { Trigger } from "@/lib/types";
import { getFoodCost } from "@/lib/game/costs";
import { FOOD_REGISTRY } from "@/lib/foods";

describe("Cow", () => {
  it.each([
    { level: 1, food: "Milk" },
    { level: 2, food: "Better Milk" },
    { level: 3, food: "Best Milk" },
  ])(
    "replaces shop food with two free $food at level $level",
    ({ level, food }) => {
      const cow = pet({ type: "Cow", level });
      const { shop } = fireShopAbility(
        Trigger.buy,
        cow,
        0,
        makeBoard([cow]),
        makeShop(["Ant"], ["Apple", "Pear"]),
        PET_REGISTRY
      );

      expect(shop.shopPets.map((pet) => pet.type)).toEqual(["Ant"]);
      expect(shop.shopFoods).toHaveLength(2);
      for (const milk of shop.shopFoods) {
        expect(milk).toMatchObject({ type: food, frozen: false });
        expect(getFoodCost(milk, FOOD_REGISTRY[food])).toBe(0);
      }
    }
  );
});
