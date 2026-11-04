import { describe, it, expect } from "vitest";
import { simulateBattle } from "@/lib/game/battle";
import { pet } from "@/__tests__/helpers";
import { PET_REGISTRY } from "@/lib/pets";
import { petToString } from "@/lib/utils/flavor-text";

describe("Ant", () => {
  // TODO - Add test that "confirms" buff is random, by providing multiple pets.  Likely needs a test.replay? - Should be in Engine
  // Check https://vitest.dev/api/test.html for ideas
  it.each([
    { level: 1, result: "Sloth (2/2)" },
    { level: 2, result: "Sloth (3/3)" },
    { level: 3, result: "Sloth (4/4)" },
  ])(
    "buffs only remaining friend for +$level/+$level on faint at level $level",
    ({ level, result }) => {
      const { steps } = simulateBattle(
        [
          pet({ type: "Ant", level }),
          pet(),
        ],
        [pet()],
        PET_REGISTRY
      );

      expect(petToString(steps[1].attackerTeam[0])).toBe(result);
    }
  );

  it("no-op when no friends remain", () => {
    // Solo Ant vs stronger opponent — no friends to buff, should not crash.
    const { result } = simulateBattle(
      [pet({ type: "Ant" })],
      [pet({ health: 2 })],
      PET_REGISTRY
    );
    expect(result).toBe("LOSS");
  });
});
