import { describe, it, expect } from "vitest";
import { simulateBattle } from "@/lib/game/battle";
import { pet } from "@/__tests__/helpers";
import { PET_REGISTRY } from "@/lib/pets";
import { MelonPerk } from "@/lib/perks/melon";

describe("Peacock", () => {
  it.each([
    { level: 1, expectedAttack: 5 },
    { level: 2, expectedAttack: 8 },
    { level: 3, expectedAttack: 11 },
  ])(
    "gains +$expectedAttack attack at level $level after attack damage",
    ({ level, expectedAttack }) => {
      const { steps } = simulateBattle(
        [pet({ type: "Peacock", attack: 2, health: 5, level })],
        [pet({ health: 20 })],
        PET_REGISTRY
      );

      expect(steps[1].attackerTeam[0].attack).toBe(expectedAttack);
    }
  );

  it("triggers for ability damage", () => {
    const { steps } = simulateBattle(
      [pet({ type: "Mosquito", attack: 2, health: 2 })],
      [pet({ type: "Peacock", attack: 2, health: 5 })],
      PET_REGISTRY
    );

    expect(steps[1].defenderTeam[0].attack).toBe(8);
  });

  it("does not trigger when damage is fully blocked", () => {
    const { steps } = simulateBattle(
      [pet({ health: 10 })],
      [pet({ type: "Peacock", attack: 2, health: 5, perk: MelonPerk })],
      PET_REGISTRY
    );

    expect(steps[1].defenderTeam[0].attack).toBe(2);
  });

  it("does not trigger when health is removed", () => {
    const { steps } = simulateBattle(
      [pet({ type: "Skunk", attack: 3, health: 5 })],
      [
        pet({ health: 5 }),
        pet({ type: "Peacock", attack: 2, health: 10 }),
      ],
      PET_REGISTRY
    );

    expect(steps[1].defenderTeam[1].health).toBe(6);
    expect(steps[1].defenderTeam[1].attack).toBe(2);
  });
});
