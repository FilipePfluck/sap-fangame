import { describe, it, expect } from "vitest";
import { simulateBattle } from "@/lib/game/battle";
import { pet } from "@/__tests__/helpers";
import { PET_REGISTRY } from "@/lib/pets";

describe("Blowfish", () => {
  it.each([
    { level: 1, damage: 3, expectedHealth: 14 },
    { level: 2, damage: 6, expectedHealth: 11 },
    { level: 3, damage: 9, expectedHealth: 8 },
  ])(
    "deals $damage ability damage to an enemy after taking a hit at level $level",
    ({ level, expectedHealth }) => {
      const { steps } = simulateBattle(
        [pet({ type: "Blowfish", attack: 3, health: 6, level })],
        [pet({  health: 20 })],
        PET_REGISTRY
      );

      expect(steps[1].defenderTeam[0].health).toBe(expectedHealth);
    }
  );
});
