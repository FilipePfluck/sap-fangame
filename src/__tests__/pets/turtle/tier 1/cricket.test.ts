import { describe, it, expect } from "vitest";
import { simulateBattle } from "@/lib/game/battle";
import { pet } from "@/__tests__/helpers";
import { PET_REGISTRY } from "@/lib/pets";
import { petToString } from "@/lib/utils/flavor-text";

describe("Cricket", () => {
  it.each([
    { level: 1, result: "Zombie Cricket (1/1)" },
    { level: 2, result: "Zombie Cricket (2/2)" },
    { level: 3, result: "Zombie Cricket (3/3)" },
  ])(
    "at level $level summons a $level/$level Zombie Cricket",
    ({ level, result }) => {
      const { steps } = simulateBattle(
        [pet({ type: "Cricket", level })],
        [pet()],
        PET_REGISTRY
      );

      expect(petToString(steps[1].attackerTeam[0])).toBe(result);
    }
  );
});
