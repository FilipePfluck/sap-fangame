import { describe, it, expect } from "vitest";
import { pet } from "@/__tests__/helpers";
import { Battle } from "@/lib/game/battle";

describe("simulateBattle", () => {
  it("results in DRAW when both single 1/1 Sloths fight", () => {
    const battle = Battle.fromPetArray({ playerPets: [pet()], enemyPets: [pet()] })
    expect(battle.result).toBe("DRAW");
    expect(battle.totalRounds).toBe(1); // 0: Start of Battle; 1+: Combat
  });

  it("results in WIN when player has a stronger pet", () => {
    const battle = Battle.fromPetArray({
      playerPets: [pet({ health: 2 })],
      enemyPets: [pet()],
    });
    expect(battle.result).toBe("WIN");
  });

  it("results in LOSS when opponent is stronger", () => {
    const battle = Battle.fromPetArray({
      playerPets: [pet()],
      enemyPets: [pet({ health: 2 })],
    });
    expect(battle.result).toBe("LOSS");
  });

  it("results in LOSS when player team is empty", () => {
    const battle = Battle.fromPetArray({
      playerPets: [],
      enemyPets: [pet()],
    })
    expect(battle.result).toBe("LOSS");
  });

  it("results in WIN when opponent team is empty", () => {
    const battle = Battle.fromPetArray({
      playerPets: [pet()],
      enemyPets: [],
    });
    expect(battle.result).toBe("WIN");
  });

  it("winning pet retains correct remaining health", () => {
    const battle = Battle.fromPetArray({
      playerPets: [pet({ health: 3 })],
      enemyPets: [pet()],
    });

    expect(battle.result).toBe("WIN");
    const lastStep = battle.steps[battle.steps.length - 1];
    expect(lastStep.summary.playerTeam[0]?.health).toBe(2);
    expect(lastStep.summary.opposingTeam).toHaveLength(0);
  });

  it("records a step for each round of combat", () => {
    const battle = Battle.fromPetArray({
      playerPets: [pet({ health: 3 })],
      enemyPets: [pet({ health: 3 })],
    })
    expect(battle.totalRounds).toBe(3);
  });

  it("does not mutate the input teams", () => {
    const playerPets = [pet()];
    const enemyPets = [pet()];
    Battle.fromPetArray({ playerPets, enemyPets });
    expect(playerPets[0].health).toBe(1);
    expect(enemyPets[0].health).toBe(1);
  });

  it("results in DRAW when both teams are all-null", () => {
    const battle = Battle.fromPetArray({
      playerPets: [],
      enemyPets: [],
    });
    expect(battle.result).toBe("DRAW");
  });

  it("front pet dies and next pet in team takes over", () => {
    const battle = Battle.fromPetArray({
      playerPets: [pet({ type: "Sloth" }), pet({ type: "Ant", attack: 2, health: 5 })],
      enemyPets: [pet()],
    });

    expect(battle.result).toBe("WIN");
    const lastStep = battle.steps[battle.steps.length - 1];
    expect(lastStep.summary.playerTeam).toHaveLength(1);
    expect(lastStep.summary.playerTeam[0]?.type).toBe("Ant");
    expect(lastStep.summary.opposingTeam).toHaveLength(0);
  });

  it("2v2: both fronts die in round 1, second pets fight to conclusion", () => {
    const battle = Battle.fromPetArray({
      playerPets: [pet(), pet({ attack: 3, health: 2 })],
      enemyPets: [pet(), pet()],
    });

    expect(battle.result).toBe("WIN");
    const lastStep = battle.steps[battle.steps.length - 1];
    expect(lastStep.summary.playerTeam).toHaveLength(1);
    expect(lastStep.summary.playerTeam[0]?.health).toBe(1);
  });

  // TODO: This test does not verify the stated behavior
  it("nulls interspersed in team are treated as empty slots", () => {
    // Only the non-null pet should fight
    const { result } = Battle.fromPetArray({
      playerPets: [null, pet({ attack: 2, health: 2 }), null],
      enemyPets: [pet()],
    });
    expect(result).toBe("WIN");
  });

  it("action description includes attacker and defender stats", () => {
    const battle = Battle.fromPetArray({
      playerPets: [pet({ attack: 2, health: 3 })],
      enemyPets: [pet()],
    });

    expect(battle.steps[1].actions[0].description).toContain("2/3");
    expect(battle.steps[1].actions[0].description).toContain("1/1");
  });

  it("ends in DRAW after hitting max rounds", () => {
    const { result } = Battle.fromPetArray({
      playerPets: [pet({ attack: 1, health: 50 }), pet({ attack: 1, health: 50 })],
      enemyPets: [pet({ attack: 1, health: 50 }), pet({ attack: 1, health: 50 })],
    });

    expect(result).toBe("DRAW");
  });
});
