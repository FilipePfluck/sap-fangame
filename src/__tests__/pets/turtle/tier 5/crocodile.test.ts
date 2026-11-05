import { describe, it, expect } from "vitest";
import { simulateBattle } from "@/lib/game/battle";
import { pet } from "@/__tests__/helpers";
import { PET_REGISTRY } from "@/lib/pets";

describe("Crocodile", () => {
  it.each([1, 2, 3])(
    "deals 8 damage to the last enemy, repeated %i times at level $level",
    (level) => {
      const { steps } = simulateBattle(
        [pet({ type: "Crocodile", attack: 8, health: 4, level })],
        [
          pet({  health: 30 }),
          pet({  health: 30 }),
        ],
        PET_REGISTRY
      );

      expect(steps[1].defenderTeam[1].health).toBe(30 - level * 8);
    }
  );

  it("deals repeated damage separately", () => {
    const { steps } = simulateBattle(
      [pet({ type: "Crocodile", attack: 8, health: 4, level: 2 })],
      [
        pet({  health: 20 }),
        pet({  health: 8 }),
      ],
      PET_REGISTRY
    );

    // Level 2 hits the last enemy (8 hp) once, killing it, then re-targets
    // the new last enemy (20 hp) for the second hit: 20 - 8 = 12. Round 1's
    // own attack (8 more) then brings it to 4 by the time this step is captured.
    expect(steps[0].defenderTeam).toHaveLength(2);
    expect(steps[1].defenderTeam).toHaveLength(1);
    expect(steps[1].defenderTeam[0].health).toBe(4);
  });
});
