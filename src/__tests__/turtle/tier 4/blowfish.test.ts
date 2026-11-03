import { describe, it, expect } from "vitest";
import { pet } from "@/__tests__/helpers";
import { Battle } from "@/lib/game/battle";

describe("Blowfish", () => {
  it.each([
    { level: 1, damage: 3, expectedHealth: 17 },
    { level: 2, damage: 6, expectedHealth: 14 },
    { level: 3, damage: 9, expectedHealth: 11 },
  ])(
    "deals $damage ability damage to an enemy after taking a hit at level $level",
    ({ level, expectedHealth }) => {
      const { steps } = Battle.fromPetArray({
        playerPets: [pet({ type: "Blowfish", attack: 0, level })],
        enemyPets: [pet({ health: 20 })],
      });

      expect(steps[1].summary.opposingTeam[0]?.health).toBe(expectedHealth);
    }
  );
});
