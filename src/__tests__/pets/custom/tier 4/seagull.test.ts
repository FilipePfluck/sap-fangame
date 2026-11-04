import { describe, it, expect } from "vitest";
import { fireBoardShopAbility, fireShopFriendSummoned } from "@/lib/game/shop-ability";
import { PET_REGISTRY } from "@/lib/pets";
import { ApiBoard, PetInstance, Trigger } from "@/lib/types";
import { simulateBattle } from "@/lib/game/battle";
import { makeBoard, makeShop, pet } from "@/__tests__/helpers";
import { MelonPerk } from "@/lib/perks/melon";

describe("Seagull", () => {
  // Board is a Melon Seagull followed by Sloths, summoned front to back.
  function summonSloths(level: number, sloths: PetInstance[]): ApiBoard {
    const seagull = pet({ type: "Seagull", level, perk: MelonPerk });
    let board = makeBoard([seagull, ...sloths]);
    for (let position = 1; position <= sloths.length; position++) {
      board = fireShopFriendSummoned(board, position, PET_REGISTRY);
    }
    return board;
  }

  function slothPerks(board: ApiBoard) {
    return board
      .slice(1)
      .filter((sloth) => sloth !== null)
      .map((sloth) => sloth.perk?.name);
  }

  it.each([
    { level: 1, perks: ["Melon", undefined, undefined, undefined] },
    { level: 2, perks: ["Melon", "Melon", undefined, undefined] },
    { level: 3, perks: ["Melon", "Melon", "Melon", undefined] },
  ])(
    "gives Melon to only the first $level of four summoned friends at level $level",
    ({ level, perks }) => {
      const board = summonSloths(level, [pet(), pet(), pet(), pet()]);

      expect(slothPerks(board)).toEqual(perks);
    }
  );

  it("does not count a summoned friend that already has Melon", () => {
    const slothWithMelon = pet({ perk: MelonPerk });
    const board = summonSloths(1, [slothWithMelon, pet()]);

    expect(slothPerks(board)).toEqual(["Melon", "Melon"]);
  });

  it("gives Melon again after the next start of turn", () => {
    const board = summonSloths(1, [pet(), pet()]);
    expect(slothPerks(board)).toEqual(["Melon", undefined]);

    const { board: nextTurn } = fireBoardShopAbility(
      Trigger.start_of_turn,
      board,
      makeShop(),
      PET_REGISTRY
    );
    const result = fireShopFriendSummoned(nextTurn, 2, PET_REGISTRY);

    expect(slothPerks(result)).toEqual(["Melon", "Melon"]);
  });

  it("shares its shop use limit with battle summons", () => {
    const seagull = pet({
      type: "Seagull",
      perk: MelonPerk,
    });
    const team = fireShopFriendSummoned(
      [
        pet({ type: "Cricket" }),
        seagull,
        pet(),
      ],
      2,
      PET_REGISTRY
    );

    expect(seagull.triggerCountsThisTurn).toEqual({
      [Trigger.friend_summoned]: 1,
    });

    const { steps } = simulateBattle(
      team,
      [pet()],
      PET_REGISTRY
    );

    expect(steps[1].attackerTeam[0].type).toBe("Zombie Cricket");
    expect(steps[1].attackerTeam[0].perk).toBeNull();
  });
});
