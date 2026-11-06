import { describe, it, expect } from "vitest";
import { simulateBattle } from "@/lib/game/battle";
import { pet } from "@/__tests__/helpers";
import { PET_REGISTRY } from "@/lib/pets";
import { getMinimumXpFor } from "@/lib/game/board";

describe("Spider", () => {
  it.each([
    { level: 1, expected: "2/2" },
    { level: 2, expected: "4/4" },
    { level: 3, expected: "6/6" },
  ])("summons a level $level tier 3 pet at $expected", ({ level }) => {
    const { steps } = simulateBattle(
      [pet({ type: "Spider", attack: 2, health: 2, level })],
      [pet({ attack: 3, health: 100 })],
      PET_REGISTRY
    );
    const summoned = steps[1].attackerTeam[0];

    expect(PET_REGISTRY[summoned.type]).toMatchObject({
      tier: 3,
      isToken: false,
    });
    expect(summoned).toMatchObject({
      attack: 2 * level,
      health: 2 * level,
      xp: getMinimumXpFor(level),
      level,
    });
  });
});
