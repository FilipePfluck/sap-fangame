import { describe, it, expect } from "vitest";
import { simulateBattle } from "@/lib/game/battle";
import { pet } from "@/__tests__/helpers";
import { PET_REGISTRY } from "@/lib/pets";

describe("Elephant", () => {
  it.each([
    { level: 1, expectedHealth: 9 },
    { level: 2, expectedHealth: 8 },
    { level: 3, expectedHealth: 7 },
  ])(
    "deals 1 damage at level $level to the friend behind",
    ({ level, expectedHealth }) => {
      const { steps } = simulateBattle(
        [
          pet({ type: "Elephant", attack: 3, health: 7, level }),
          pet({  health: 10 }),
        ],
        [pet({  health: 100 })],
        PET_REGISTRY
      );

      expect(steps[1].attackerTeam[1].health).toBe(expectedHealth);
    }
  );

  it("targets only the nearest friend behind", () => {
    const { steps } = simulateBattle(
      [
        pet({ type: "Elephant", attack: 3, health: 7, level: 2 }),
        pet({  health: 10 }),
        pet({  health: 10 }),
      ],
      [pet({  health: 100 })],
      PET_REGISTRY
    );

    expect(steps[1].attackerTeam[1].health).toBe(8);
    expect(steps[1].attackerTeam[2].health).toBe(10);
  });

  it("retargets a living friend if the first one faints", () => {
    const { steps } = simulateBattle(
      [
        pet({ type: "Elephant", attack: 3, health: 7, level: 2 }),
        pet(),
        pet({  health: 10 }),
      ],
      [pet({  health: 100 })],
      PET_REGISTRY
    );

    expect(steps[1].attackerTeam).toHaveLength(2);
    expect(steps[1].attackerTeam[1].health).toBe(9);
  });
});
