import { describe, it, expect } from "vitest";
import { pet } from "@/__tests__/helpers";
import { simulateBattle } from "@/lib/game/battle";
import { PET_REGISTRY } from "@/lib/pets";

describe("Gorilla", () => {
  it.each([
    { level: 1, expectedActivationStep: 1 },
    { level: 2, expectedActivationStep: 3 },
    { level: 3, expectedActivationStep: 5 },
  ])(
    "gains Coconut up to $level times per battle",
    ({ level, expectedActivationStep }) => {
      const { steps } = simulateBattle(
        [pet({ type: "Gorilla", attack: 7, health: 10, level })],
        [pet({  health: 100 })],
        PET_REGISTRY
      );

      expect(steps[expectedActivationStep].attackerTeam[0].perk?.name).toBe(
        "Coconut"
      );
      expect(steps[expectedActivationStep + 2].attackerTeam[0].perk).toBeNull();
    }
  );

  it("resolves both level 2 Elephant hits before Gorilla activates Hurt", () => {
    const { steps } = simulateBattle(
      [
        pet({ type: "Elephant", attack: 3, health: 7, level: 2 }),
        pet({ type: "Gorilla", attack: 7, health: 10, level: 2 }),
      ],
      [pet({  health: 100 })],
      PET_REGISTRY
    );

    expect(steps[1].attackerTeam[1]).toMatchObject({
      health: 8,
      perk: { name: "Coconut" },
    });
  });
});
