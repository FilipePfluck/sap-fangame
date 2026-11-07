import { describe, it, expect } from "vitest";
import { PET_REGISTRY } from "@/lib/pets";
import { makeBoard, makeShop, pet } from "@/__tests__/helpers";
import { fireBoardShopAbility } from "@/lib/game/shop-ability";
import { Trigger } from "@/lib/types";

describe("Swan", () => {
  it.each([{ level: 1 }, { level: 2 }, { level: 3 }])(
    "gives +$level gold at level $level",
    ({ level }) => {
      const swan = pet({ type: "Swan", level });
      const board = makeBoard([swan]);

      const { goldDelta } = fireBoardShopAbility(
        Trigger.start_of_turn,
        board,
        makeShop(),
        PET_REGISTRY
      );
      expect(goldDelta).toBe(level);
    }
  );
});
