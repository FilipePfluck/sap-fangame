import { describe, it, expect } from "vitest";
import { simulateBattle } from "@/lib/game/battle";
import { pet } from "@/__tests__/helpers";
import { PET_REGISTRY } from "@/lib/pets";
import { petToString } from "@/lib/utils/flavor-text";

describe("Kangaroo", () => {
  it.each([
    { level: 1, expected: "Kangaroo (3/3)" },
    { level: 2, expected: "Kangaroo (4/4)" },
    { level: 3, expected: "Kangaroo (5/5)" },
  ])(
    "gains +$level/+$level when its friend ahead attacks at level $level",
    ({ level, expected }) => {
      const { steps } = simulateBattle(
        [
          pet({ health: 10 }),
          pet({ type: "Kangaroo", attack: 2, health: 2, level }),
        ],
        [pet({ health: 100 })],
        PET_REGISTRY
      );

      expect(petToString(steps[1].attackerTeam[1])).toBe(expected);
    }
  );

  it("does not trigger from its own attack when a friend is behind", () => {
    const { steps } = simulateBattle(
      [
        pet({ type: "Kangaroo", attack: 2, health: 2, level: 1 }),
        pet({ health: 10 }),
      ],
      [pet({ health: 100 })],
      PET_REGISTRY
    );

    expect(petToString(steps[1].attackerTeam[0])).toBe("Kangaroo (2/1)");
  });
});
