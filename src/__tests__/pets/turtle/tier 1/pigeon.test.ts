import { describe, it, expect } from "vitest";
import { PET_REGISTRY } from "@/lib/pets";
import { makeBoard, makeShop, pet } from "@/__tests__/helpers";
import { fireShopAbility } from "@/lib/game/shop-ability";
import { Trigger } from "@/lib/types";

describe("Pigeon", () => {
  it.each([{ level: 1 }, { level: 2 }, { level: 3 }])(
    "adds $level Bread Crumbs to shop at level $level",
    ({ level }) => {
      const pigeon = pet({ type: "Pigeon", level });
      const board = makeBoard([pigeon]);
      const { shop } = fireShopAbility(
        Trigger.sell,
        pigeon,
        0,
        board,
        makeShop(),
        PET_REGISTRY
      );

      expect(shop.shopFoods).toHaveLength(level);
      for (const food of shop.shopFoods) {
        expect(food.type).toBe("Bread Crumbs");
        expect(food.frozen).toBe(false);
      }
    }
  );
});
