import { describe, it, expect } from "vitest";
import { PET_REGISTRY } from "@/lib/pets";
import { makeBoard, makeShop, pet } from "@/__tests__/helpers";
import { fireShopAbility } from "@/lib/game/shop-ability";
import { ShopState, Trigger } from "@/lib/types";

describe("Duck", () => {
  it.each([{ level: 1 }, { level: 2 }, { level: 3 }])(
    "increments shop health for all current shop pets by $level at level $level",
    ({ level }) => {
      const duck = pet({ type: "Duck", level });
      const shop = makeShop(["Sloth", "Ant", "Beaver", "Badger", "Bison"]);
      const board = makeBoard([duck]);

      const { shop: result } = fireShopAbility(
        Trigger.sell,
        duck,
        0,
        board,
        shop,
        PET_REGISTRY
      );

      for (const shopPet of result.shopPets) {
        expect(shopPet.tempHealthBonus).toBe(level);
      }
    }
  );

  it("stacks tempHealthBonus additively", () => {
    const duck = pet({ type: "Duck" });
    const shop: ShopState = {
      shopPets: [{ type: "Sloth", frozen: false, tempHealthBonus: 2 }],
      shopFoods: [],
    };
    const board = makeBoard([duck]);

    const { shop: result } = fireShopAbility(
      Trigger.sell,
      duck,
      0,
      board,
      shop,
      PET_REGISTRY
    );
    expect(result.shopPets[0].tempHealthBonus).toBe(3);
  });

  it("does not modify original shop", () => {
    const duck = pet({ type: "Duck" });
    const shop = makeShop(["Sloth"]);
    const board = makeBoard([duck]);

    fireShopAbility(Trigger.sell, duck, 0, board, shop, PET_REGISTRY);
    expect(shop.shopPets[0].tempHealthBonus).toBeUndefined();
  });
});
