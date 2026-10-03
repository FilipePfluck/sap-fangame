import { describe, it, expect } from "vitest";
import { simulateBattle } from "@/lib/game/battle";
import { pet } from "@/__tests__/helpers";

describe("simulateBattle", () => {
  it("results in DRAW when both single 1/1 Sloths fight", () => {
    const { result, steps } = simulateBattle([pet()], [pet()]);
    expect(result).toBe("DRAW");
    // step 0: initial state, step 1: after round
    expect(steps).toHaveLength(2);
    expect(steps[0].description).toBe("Battle start");
  });

  it("results in WIN when player has a stronger pet", () => {
    const { result } = simulateBattle([pet({ attack: 2, health: 2 })], [pet()]);
    expect(result).toBe("WIN");
  });

  it("results in LOSS when opponent is stronger", () => {
    const { result } = simulateBattle([pet()], [pet({ attack: 2, health: 2 })]);
    expect(result).toBe("LOSS");
  });

  it("results in LOSS when player team is empty", () => {
    const { result } = simulateBattle([null, null, null, null, null], [pet()]);
    expect(result).toBe("LOSS");
  });

  it("results in WIN when opponent team is empty", () => {
    const { result } = simulateBattle([pet()], []);
    expect(result).toBe("WIN");
  });

  it("winning pet retains correct remaining health", () => {
    // 2/3 vs 1/1: 2/3 takes 1 damage → 2/2, opponent faints
    const { result, steps } = simulateBattle([pet({ attack: 2, health: 3 })], [pet()]);
    expect(result).toBe("WIN");
    const lastStep = steps[steps.length - 1];
    expect(lastStep.attackerTeam[0].health).toBe(2);
    expect(lastStep.defenderTeam).toHaveLength(0);
  });

  it("records a step for each round of combat", () => {
    // 1/3 vs 1/3: takes 3 rounds, plus initial = 4 steps
    const { steps } = simulateBattle([pet({ health: 3 })], [pet({ health: 3 })]);
    expect(steps).toHaveLength(4); // initial + 3 rounds
  });

  it("does not mutate the input teams", () => {
    const playerTeam = [pet()];
    const opponentTeam = [pet()];
    simulateBattle(playerTeam, opponentTeam);
    expect(playerTeam[0].health).toBe(1);
    expect(opponentTeam[0].health).toBe(1);
  });

  it("results in DRAW when both teams are all-null", () => {
    const { result } = simulateBattle([null, null, null], [null, null, null]);
    expect(result).toBe("DRAW");
  });

  it("front pet dies and next pet in team takes over", () => {
    // Player: 1/1, 2/5. Opponent: 1/1.
    // Round 1: front 1/1 vs 1/1 → both die. Player's 2/5 now fights empty opponent → WIN.
    const { result, steps } = simulateBattle(
      [pet(), pet({ attack: 2, health: 5 })],
      [pet()]
    );
    expect(result).toBe("WIN");
    const lastStep = steps[steps.length - 1];
    expect(lastStep.attackerTeam).toHaveLength(1);
    expect(lastStep.attackerTeam[0].attack).toBe(2);
    expect(lastStep.defenderTeam).toHaveLength(0);
  });

  it("2v2: both fronts die in round 1, second pets fight to conclusion", () => {
    // Player: 1/1, 3/2. Opponent: 1/1, 1/1.
    // Round 1: both fronts (1/1 each) die simultaneously.
    // Round 2: player's 3/2 vs opponent's 1/1 → opponent takes 3 dmg and dies, player takes 1 dmg → 3/1 survives → WIN.
    const { result, steps } = simulateBattle(
      [pet(), pet({ attack: 3, health: 2 })],
      [pet(), pet()]
    );
    expect(result).toBe("WIN");
    const lastStep = steps[steps.length - 1];
    expect(lastStep.attackerTeam).toHaveLength(1);
    expect(lastStep.attackerTeam[0].health).toBe(1);
  });

  it("nulls interspersed in team are treated as empty slots", () => {
    // Only the non-null pet should fight
    const { result } = simulateBattle(
      [null, pet({ attack: 2, health: 2 }), null],
      [pet()]
    );
    expect(result).toBe("WIN");
  });

  it("step description includes attacker and defender stats", () => {
    const { steps } = simulateBattle([pet({ attack: 2, health: 3 })], [pet()]);
    const combatStep = steps[1];
    expect(combatStep.description).toContain("2/3");
    expect(combatStep.description).toContain("1/1");
  });

  it("ends in DRAW after hitting max rounds", () => {
    // Both sides have 1 attack and 100 health → 99 rounds needed, exceeds MAX_ROUNDS (50)
    const { result } = simulateBattle(
      [pet({ attack: 1, health: 100 })],
      [pet({ attack: 1, health: 100 })]
    );
    expect(result).toBe("DRAW");
  });
});
