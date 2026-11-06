import { describe, it, expect } from "vitest";
import { simulateBattle } from "@/lib/game/battle";
import { pet } from "@/__tests__/helpers";
import { PET_REGISTRY } from "@/lib/pets";

describe("Rhino", () => {
  const RHINO_ABILITY_DAMAGE = 4;
  const TIER_1_MULTIPLIER = 2;

  it.each([
    { level: 1, ability_damage: RHINO_ABILITY_DAMAGE },
    { level: 2, ability_damage: RHINO_ABILITY_DAMAGE * 2 },
    { level: 3, ability_damage: RHINO_ABILITY_DAMAGE * 3 },
  ])(
    "deals $ability_damage damage to next non-tier 1 enemy at level $level",
    ({ level }) => {
      const { steps } = simulateBattle(
        [pet({ type: "Rhino", attack: 6, health: 7, level })],
        [
          pet(),
          pet({ type: "Dodo",  health: 50 }),
        ],
        PET_REGISTRY
      );

      expect(steps[1].defenderTeam[0].health).toBe(50 - 4 * level);
    }
  );

  it.each([
    { level: 1, ability_damage: TIER_1_MULTIPLIER * RHINO_ABILITY_DAMAGE },
    {
      level: 2,
      ability_damage: TIER_1_MULTIPLIER * RHINO_ABILITY_DAMAGE * 2,
    },
    {
      level: 3,
      ability_damage: TIER_1_MULTIPLIER * RHINO_ABILITY_DAMAGE * 3,
    },
  ])(
    "deals $ability_damage damage to next non-tier 1 enemy at level $level",
    ({ level }) => {
      const { steps } = simulateBattle(
        [pet({ type: "Rhino", attack: 6, health: 7, level })],
        [
          pet(),
          pet({  health: 50 }),
        ],
        PET_REGISTRY
      );

      expect(steps[1].defenderTeam[0].health).toBe(50 - 8 * level);
    }
  );
});
