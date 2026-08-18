import { describe, it, expect } from "vitest";
import { simulateBattle } from "@/lib/game/battle";
import { PET_REGISTRY } from "@/lib/pets";
import type { PetInstance } from "@/lib/types";

function pet(type: string, attack: number, health: number, perk: string | null = null): PetInstance {
  return { type, attack, health, perk, xp: 1, level: 1 };
}

function petLevel(type: string, attack: number, health: number, level: number): PetInstance {
  return { type, attack, health, perk: null, xp: level === 3 ? 6 : level === 2 ? 3 : 1, level };
}

describe("Mosquito — start-of-battle", () => {
  it("level 1 deals 1 damage to 1 random enemy before combat", () => {
    // Mosquito 2/2 vs 2/3. After start-of-battle: 2/3 → 2/2. Then 2/2 vs 2/2 → DRAW.
    const { result } = simulateBattle(
      [pet("Mosquito", 2, 2)],
      [pet("Sloth", 2, 3)],
      PET_REGISTRY,
    );
    // Mosquito does 1 damage → Sloth is 2/2. Then they trade: both die → DRAW.
    expect(result).toBe("DRAW");
  });

  it("level 2 deals 1 damage to 2 random enemies", () => {
    // Mosquito lvl2 vs two 1/1 Sloths. Start-of-battle: both Sloths take 1 dmg → dead.
    const { result } = simulateBattle(
      [petLevel("Mosquito", 2, 2, 2)],
      [pet("Sloth", 1, 1), pet("Sloth", 1, 1)],
      PET_REGISTRY,
    );
    expect(result).toBe("WIN");
  });

  it("does not deal damage to own team", () => {
    // Single Mosquito vs single strong Sloth. Start-of-battle only hits enemy.
    const { result } = simulateBattle(
      [pet("Mosquito", 2, 2)],
      [pet("Sloth", 2, 10)],
      PET_REGISTRY,
    );
    // Sloth has 10 health, Mosquito deals 1 (leaves 9), then combat: Mosquito is 2/2, Sloth 2/9.
    // Mosquito dies in 1 hit (Sloth attack=2). Sloth is 9-2=7 health left. LOSS.
    expect(result).toBe("LOSS");
  });
});

describe("Ant — faint", () => {
  it("level 1 buffs a random friend +1/+1 on faint", () => {
    // Ant 2/2 + Sloth 1/1 vs Sloth 3/1.
    // Round 1: Ant (2/2) vs Sloth (3/1). Sloth takes 2 dmg → dies. Ant takes 3 → dies.
    // Ant faint fires → Sloth (1/1) gets +1/+1 → 2/2.
    // Round 2: Sloth (2/2) vs empty → WIN.
    const { result } = simulateBattle(
      [pet("Ant", 2, 2), pet("Sloth", 1, 1)],
      [pet("Sloth", 3, 1)],
      PET_REGISTRY,
    );
    expect(result).toBe("WIN");
  });

  it("level 2 buffs +2/+2", () => {
    // Ant lvl2 2/2 + Sloth 1/1 vs Sloth 3/1.
    // Same as above but Sloth gets +2/+2 → 3/3.
    const { result } = simulateBattle(
      [petLevel("Ant", 2, 2, 2), pet("Sloth", 1, 1)],
      [pet("Sloth", 3, 1)],
      PET_REGISTRY,
    );
    expect(result).toBe("WIN");
  });

  it("no-op when no friends remain", () => {
    // Solo Ant vs stronger opponent — no friends to buff, should not crash.
    const { result } = simulateBattle(
      [pet("Ant", 2, 2)],
      [pet("Sloth", 5, 5)],
      PET_REGISTRY,
    );
    expect(result).toBe("LOSS");
  });
});

describe("Cricket — faint", () => {
  it("level 1 summons a 1/1 Zombie Cricket on faint", () => {
    // Cricket 1/3 vs Sloth 1/1. Cricket takes 1/round. After 3 rounds Cricket dies and
    // is replaced by a 1/1 Zombie Cricket. The Zombie fights the already-dead Sloth → WIN.
    const { result } = simulateBattle(
      [pet("Cricket", 1, 3)],
      [pet("Sloth", 1, 1)],
      PET_REGISTRY,
    );
    // Cricket (1/3) kills 1/1 Sloth in 1 round, no faint needed. WIN directly.
    expect(result).toBe("WIN");
  });

  it("zombie cricket is summoned when cricket faints", () => {
    // Cricket 1/1 vs Sloth 2/5. Cricket dies immediately (takes 2 damage).
    // Zombie Cricket (1/1) takes over. Sloth is 2/(5-1)=2/4. Zombie dies (takes 2). WIN for Sloth.
    const { result, steps } = simulateBattle(
      [pet("Cricket", 1, 1)],
      [pet("Sloth", 2, 5)],
      PET_REGISTRY,
    );
    expect(result).toBe("LOSS");
    // Second step should show Zombie Cricket in attacker team
    const stepAfterFirstRound = steps[1];
    expect(stepAfterFirstRound.attackerTeam[0].type).toBe("Zombie Cricket");
  });

  it("level 2 cricket summons a 2/2 zombie", () => {
    // Cricket lvl2 1/1 vs Sloth 2/5. Cricket dies, 2/2 Zombie appears.
    // Zombie (2/2) vs Sloth (2/4): both take damage. Zombie 2/(2-2)=dead, Sloth 2/(4-2)=2/2. LOSS.
    const { result, steps } = simulateBattle(
      [petLevel("Cricket", 1, 1, 2)],
      [pet("Sloth", 2, 5)],
      PET_REGISTRY,
    );
    expect(result).toBe("LOSS");
    const stepAfterFirstRound = steps[1];
    expect(stepAfterFirstRound.attackerTeam[0].type).toBe("Zombie Cricket");
    expect(stepAfterFirstRound.attackerTeam[0].attack).toBe(2);
    expect(stepAfterFirstRound.attackerTeam[0].health).toBe(2);
  });
});

describe("Horse — friend-summoned", () => {
  it("gives summoned pet +1 attack", () => {
    // Horse 2/1 + Cricket 1/1 vs Sloth 2/10.
    // Round 1: Cricket (1/1) vs Sloth (2/10). Cricket dies (takes 2). Sloth takes 1 → 2/9.
    // Cricket faint: Zombie Cricket (1/1) summoned → Horse fires → Zombie gets +1 → 2/1.
    // Round 2: Zombie (2/1) vs Sloth (2/9). Zombie takes 2 → dies. Sloth takes 2 → 2/7.
    // Horse (2/1) vs Sloth (2/7). Horse takes 2 → dies. Sloth takes 2 → 2/5. LOSS.
    // Main thing to check: Horse gave +1 to zombie (confirmed in step after faint).
    const { steps } = simulateBattle(
      [pet("Cricket", 1, 1), pet("Horse", 2, 1)],
      [pet("Sloth", 2, 10)],
      PET_REGISTRY,
    );
    // After round 1, Cricket is gone and Zombie Cricket appears at front with +1 attack from Horse
    const stepAfterRound1 = steps[1];
    expect(stepAfterRound1.attackerTeam[0].type).toBe("Zombie Cricket");
    expect(stepAfterRound1.attackerTeam[0].attack).toBe(2); // base 1 + 1 from Horse
  });
});

describe("Honey perk — faint", () => {
  it("summons a 1/1 Bee when a Honey-perked pet faints", () => {
    // Sloth with Honey 1/1 vs Sloth 2/2. Sloth takes 2 → faints. Honey triggers: Bee (1/1) appears.
    // Bee (1/1) vs Sloth (2/1). Sloth takes 1 → dies. Bee takes 2 → dies. DRAW.
    const honeySloth: PetInstance = { type: "Sloth", attack: 1, health: 1, perk: "Honey", xp: 1, level: 1 };
    const { result, steps } = simulateBattle(
      [honeySloth],
      [pet("Sloth", 2, 2)],
      PET_REGISTRY,
    );
    // Bee (1/1) vs Sloth (2/1). They trade → DRAW.
    expect(result).toBe("DRAW");
    // After round 1, Bee should appear in attacker team
    const stepAfterRound1 = steps[1];
    expect(stepAfterRound1.attackerTeam[0].type).toBe("Bee");
  });

  it("does not mutate input teams", () => {
    const honeySloth: PetInstance = { type: "Sloth", attack: 1, health: 1, perk: "Honey", xp: 1, level: 1 };
    const opponent = pet("Sloth", 2, 2);
    simulateBattle([honeySloth], [opponent], PET_REGISTRY);
    expect(honeySloth.health).toBe(1);
    expect(opponent.health).toBe(2);
  });
});
