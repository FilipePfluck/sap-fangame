import { describe, it, expect } from "vitest";
import { PET_REGISTRY } from "@/lib/pets";
import { makeBoard, makeShop, pet } from "@/__tests__/helpers";
import { fireBoardShopAbility } from "@/lib/game/shop-ability";
import { PetData, Trigger } from "@/lib/types";

describe("Bison", () => {
  it.each([
    { level: 1, ability: "+2/+2", expected: 3 },
    { level: 2, ability: "+4/+4", expected: 5 },
    { level: 3, ability: "+6/+6", expected: 7 },
  ])(
    "gains $ability at level $level when it has a level-3 friend",
    ({ level, expected }) => {
      const bison = pet({ type: "Bison", level });
      const levelThreeFriend = pet({ level: 3 });
      const board = makeBoard([bison, levelThreeFriend]);
      const { board: result } = fireBoardShopAbility(
        Trigger.end_turn,
        board,
        makeShop(),
        PET_REGISTRY,
        "WIN"
      );

      expect((result[0] as PetData).attack).toBe(expected);
      expect((result[0] as PetData).health).toBe(expected);
    }
  );

  it("no-op without a level-3 friend", () => {
    const bison = pet({ type: "Bison" });
    const friend = pet();
    const board = makeBoard([bison, friend]);
    const { board: result } = fireBoardShopAbility(
      Trigger.end_turn,
      board,
      makeShop(),
      PET_REGISTRY,
      "WIN"
    );
    expect((result[0] as PetData).attack).toBe(1);
    expect((result[0] as PetData).health).toBe(1);
  });

  it("no-op if it is the level-3 friend", () => {
    const bison = pet({ type: "Bison", level: 3 });
    const board = makeBoard([bison]);
    const { board: result } = fireBoardShopAbility(
      Trigger.end_turn,
      board,
      makeShop(),
      PET_REGISTRY,
      "WIN"
    );

    expect(result[0]!.attack).toBe(1);
    expect(result[0]!.health).toBe(1);
  });

  it("only the first Bison on the board applies the buff", () => {
    const bison1 = pet({ type: "Bison" });
    const bison2 = pet({ type: "Bison" });
    const levelThreeFriend = pet({ level: 3 });
    const board = makeBoard([bison1, bison2, levelThreeFriend]);
    const { board: result } = fireBoardShopAbility(
      Trigger.end_turn,
      board,
      makeShop(),
      PET_REGISTRY,
      "WIN"
    );
    expect((result[0] as PetData).attack).toBe(3);
    expect((result[1] as PetData).attack).toBe(1); // second Bison unaffected
  });
});
