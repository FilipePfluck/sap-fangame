import { describe, it, expect } from "vitest";
import { simulateBattle } from "@/lib/game/battle";
import { pet } from "@/__tests__/helpers";
import { PET_REGISTRY } from "@/lib/pets";

describe("Snake", () => {
  it.each([
    { level: 1, damage: 5, expectedHealth: 194 },
    { level: 2, damage: 10, expectedHealth: 189 },
    { level: 3, damage: 15, expectedHealth: 184 },
  ])(
    "deals $damage damage to a random enemy at level $level",
    ({ level, expectedHealth }) => {
      const { steps } = simulateBattle(
        [
          pet({  health: 100 }),
          pet({ type: "Snake", attack: 8, health: 3, level }),
        ],
        [pet({  health: 200 })],
        PET_REGISTRY
      );

      expect(steps[1].defenderTeam[0].health).toBe(expectedHealth);
    }
  );

  it("deals damage at most five times", () => {
    const { steps } = simulateBattle(
      [
        pet({  health: 100 }),
        pet({ type: "Snake", attack: 8, health: 3 }),
      ],
      [pet({  health: 200 })],
      PET_REGISTRY
    );

    expect(steps.at(-1)?.defenderTeam[0].health).toBe(125);
  });
});
