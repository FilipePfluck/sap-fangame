import { describe, it, expect } from "vitest";
import { simulateBattle } from "@/lib/game/battle";
import { pet } from "@/__tests__/helpers";
import { PET_REGISTRY } from "@/lib/pets";
import { petToString } from "@/lib/utils/flavor-text";

describe("Rooster", () => {
  it.each([
    { level: 1, expected: ["Chick (3/1)"] },
    { level: 2, expected: ["Chick (3/1)", "Chick (3/1)"] },
    { level: 3, expected: ["Chick (3/1)", "Chick (3/1)", "Chick (3/1)"] },
  ])(
    "summons $level Chick tokens with half its attack at level $level",
    ({ level, expected }) => {
      const { steps } = simulateBattle(
        [pet({ type: "Rooster", attack: 6, health: 4, level })],
        [pet({ attack: 4, health: 100 })],
        PET_REGISTRY
      );

      expect(steps[1].attackerTeam.map(petToString)).toEqual(expected);
    }
  );

  it("rounds half its attack down", () => {
    const { steps } = simulateBattle(
      [pet({ type: "Rooster", attack: 5, health: 4 })],
      [pet({ attack: 4, health: 100 })],
      PET_REGISTRY
    );

    expect(petToString(steps[1].attackerTeam[0])).toBe("Chick (2/1)");
  });

  it("does not summon a Chick with 0 attack", () => {
    const { steps } = simulateBattle(
      [pet({ type: "Rooster",  health: 1 })],
      [pet({ attack: 4, health: 100 })],
      PET_REGISTRY
    );

    expect(steps[1].attackerTeam).toHaveLength(0);
  });
});
