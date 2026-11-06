import { describe, it, expect } from "vitest";
import { simulateBattle } from "@/lib/game/battle";
import { makeBoard, pet } from "@/__tests__/helpers";
import { PET_REGISTRY } from "@/lib/pets";
import { petToString } from "@/lib/utils/flavor-text";
import { fireShopFriendSummoned } from "@/lib/game/shop-ability";
import { PetInstance } from "@/lib/types";

describe("Horse", () => {
  it.each([
    { level: 1, result: "Zombie Cricket (2/1)" },
    { level: 2, result: "Zombie Cricket (3/1)" },
    { level: 3, result: "Zombie Cricket (4/1)" },
  ])(
    "gives summoned pets +$level attack at level $level",
    ({ level, result }) => {
      // NOTE: Test can fail due to Cricket being incorrectly implemented
      // Sloth kills Cricket, Cricket summons 1/1 Zombie Cricket, test confirms Horse provides an appropriate buff
      const { steps } = simulateBattle(
        [
          pet({ type: "Cricket" }),
          pet({ type: "Horse", attack: 2,  level }),
        ],
        [pet({ attack: 2, health: 10 })],
        PET_REGISTRY
      );

      const stepAfterRound1 = steps[1];
      expect(petToString(stepAfterRound1.attackerTeam[0])).toBe(result);
    }
  );

  it("records Horse's shop buff as temporary attack", () => {
    const horse = pet({ type: "Horse", level: 2 });
    const sloth = pet();
    const result = fireShopFriendSummoned(
      makeBoard([horse, sloth]),
      1,
      PET_REGISTRY
    );
    expect((result[1] as PetInstance).attack).toBe(3);
    expect((result[1] as PetInstance).tempAttack).toBe(2);
  });
});
