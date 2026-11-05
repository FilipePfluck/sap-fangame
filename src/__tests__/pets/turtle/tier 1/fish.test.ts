import { describe, it, expect } from "vitest";
import { PET_REGISTRY } from "@/lib/pets";
import { makeBoard, makeShop, pet } from "@/__tests__/helpers";
import { fireShopAbility } from "@/lib/game/shop-ability";
import { PetInstance, Trigger } from "@/lib/types";

describe("Fish", () => {
  it("level-up from lvl1 gives 2 friends +1/+1", () => {
    // Pass pet at OLD level (1) to simulate Fish leveling up from 1
    const fish = pet({ type: "Fish" });
    const sloth1 = pet();
    const sloth2 = pet();
    const board = makeBoard([sloth1, fish, sloth2]);

    const { board: result } = fireShopAbility(
      Trigger.level_up,
      fish,
      1,
      board,
      makeShop(),
      PET_REGISTRY
    );
    expect((result[0] as PetInstance).attack).toBe(2);
    expect((result[0] as PetInstance).health).toBe(2);
    expect((result[2] as PetInstance).attack).toBe(2);
    expect((result[2] as PetInstance).health).toBe(2);
  });

  it("level-up from lvl2 gives 2 friends +2/+2", () => {
    const fish = pet({ type: "Fish", level: 2 });
    const sloth1 = pet();
    const sloth2 = pet();
    const board = makeBoard([sloth1, fish, sloth2]);

    const { board: result } = fireShopAbility(
      Trigger.level_up,
      fish,
      1,
      board,
      makeShop(),
      PET_REGISTRY
    );
    expect((result[0] as PetInstance).attack).toBe(3);
    expect((result[0] as PetInstance).health).toBe(3);
    expect((result[2] as PetInstance).attack).toBe(3);
    expect((result[2] as PetInstance).health).toBe(3);
  });

  it("no-op when no friends on board", () => {
    const fish = pet({ type: "Fish" });
    const board = makeBoard([fish]);
    const { board: result } = fireShopAbility(
      Trigger.level_up,
      fish,
      0,
      board,
      makeShop(),
      PET_REGISTRY
    );
    expect(result[0]).toEqual(fish);
  });
});
