import { describe, it, expect } from "vitest";
import { simulateBattle } from "@/lib/game/battle";
import type { PetInstance } from "@/lib/types";

function sloth(overrides?: Partial<PetInstance>): PetInstance {
  return { type: "Sloth", attack: 1, health: 1, perk: null, xp: 0, level: 1, ...overrides };
}

describe("simulateBattle", () => {
  it("results in DRAW when both single 1/1 Sloths fight", () => {
    const { result, steps } = simulateBattle([sloth()], [sloth()]);
    expect(result).toBe("DRAW");
    // step 0: initial state, step 1: after round
    expect(steps).toHaveLength(2);
    expect(steps[0].description).toBe("Battle start");
  });

  it("results in WIN when player has a stronger pet", () => {
    const { result } = simulateBattle([sloth({ attack: 2, health: 2 })], [sloth()]);
    expect(result).toBe("WIN");
  });

  it("results in LOSS when opponent is stronger", () => {
    const { result } = simulateBattle([sloth()], [sloth({ attack: 2, health: 2 })]);
    expect(result).toBe("LOSS");
  });

  it("results in LOSS when player team is empty", () => {
    const { result } = simulateBattle([null, null, null, null, null], [sloth()]);
    expect(result).toBe("LOSS");
  });

  it("results in WIN when opponent team is empty", () => {
    const { result } = simulateBattle([sloth()], []);
    expect(result).toBe("WIN");
  });

  it("winning pet retains correct remaining health", () => {
    // 2/3 vs 1/1: 2/3 takes 1 damage → 2/2, opponent faints
    const { result, steps } = simulateBattle([sloth({ attack: 2, health: 3 })], [sloth()]);
    expect(result).toBe("WIN");
    const lastStep = steps[steps.length - 1];
    expect(lastStep.attackerTeam[0].health).toBe(2);
    expect(lastStep.defenderTeam).toHaveLength(0);
  });

  it("records a step for each round of combat", () => {
    // 1/3 vs 1/3: takes 3 rounds, plus initial = 4 steps
    const { steps } = simulateBattle([sloth({ health: 3 })], [sloth({ health: 3 })]);
    expect(steps).toHaveLength(4); // initial + 3 rounds
  });

  it("does not mutate the input teams", () => {
    const playerTeam = [sloth()];
    const opponentTeam = [sloth()];
    simulateBattle(playerTeam, opponentTeam);
    expect(playerTeam[0].health).toBe(1);
    expect(opponentTeam[0].health).toBe(1);
  });
});
