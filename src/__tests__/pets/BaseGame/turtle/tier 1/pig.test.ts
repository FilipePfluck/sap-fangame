import { describe, it, expect } from "vitest";
import { PET_REGISTRY } from "@/lib/pets";
import { makeBoard, makeShop, pet } from "@/__tests__/helpers";
import { fireShopAbility } from "@/lib/game/shop-ability";
import { Trigger } from "@/lib/types";

describe("Pig", () => {
  it.each([{ level: 1 }, { level: 2 }, { level: 3 }])(
    "level $level gives +$level gold",
    ({ level }) => {
      const pig = pet({ type: "Pig", level });
      const board = makeBoard([pig]);

      const { goldDelta } = fireShopAbility(
        Trigger.sell,
        pig,
        0,
        board,
        makeShop(),
        PET_REGISTRY
      );
      expect(goldDelta).toBe(level);
    }
  );
});
