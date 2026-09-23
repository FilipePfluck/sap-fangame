import { describe, it, expect } from "vitest";
import { simulateBattle } from "@/lib/game/battle";
import { PET_REGISTRY } from "@/lib/pets";
import type { PetInstance } from "@/lib/types";
import { petToString } from "@/lib/utils/flavor-text";

function pet(type: string, attack: number, health: number, perk: string | null = null): PetInstance {
  return { type, attack, health, perk, xp: 1, level: 1 };
}

function petLevel(type: string, attack: number, health: number, level: number): PetInstance {
  return { type, attack, health, perk: null, xp: level === 3 ? 6 : level === 2 ? 3 : 1, level };
}

describe("Mosquito — start-of-battle", () => {
  it.each([
    { level: 1, expected: "LOSS" },
    { level: 2, expected: "DRAW" },
    { level: 3, expected: "WIN" },
  ])(
    "deals 1 random damage to $level random enemy at level $level at start of battle",
    ({ level, expected }) => {
      const { result } = simulateBattle(
        [petLevel("Mosquito", 2, 2, level)],
        [pet("Sloth", 2, 1), pet("Sloth", 2, 1), pet("Sloth", 2, 1)],
        PET_REGISTRY
      );

      expect(result).toBe(expected);
    }
  );

  // TODO - Update test. Does not verify behavior (i.e. no teammates to hit, if teammate was hit instead, the test would still pass)
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
  // TODO - Add test that "confirms" buff is random, by providing multiple pets.  Likely needs a test.replay?
  // Check https://vitest.dev/api/test.html for ideas
  it.each([
    { level: 1, result: "Sloth (2/2)" },
    { level: 2, result: "Sloth (3/3)" },
    { level: 3, result: "Sloth (4/4)" },
  ])(
    "buffs only remaining friend for +$level/+$level on faint at level $level",
    ({ level, result }) => {
      const { steps } = simulateBattle(
        [petLevel("Ant", 1, 1, level), pet("Sloth", 1, 1)],
        [pet("Sloth", 5, 5)],
        PET_REGISTRY
      );

      expect(petToString(steps[1].attackerTeam[0])).toBe(result);
    }
  );

  it("no-op when no friends remain", () => {
    // Solo Ant vs stronger opponent — no friends to buff, should not crash.
    const { result } = simulateBattle(
      [pet("Ant", 2, 2)],
      [pet("Sloth", 5, 5)],
      PET_REGISTRY
    );
    expect(result).toBe("LOSS");
  });
});

describe("Cricket — faint", () => {
  it.each([
    { level: 1, result: "Zombie Cricket (1/1)" },
    { level: 2, result: "Zombie Cricket (2/2)" },
    { level: 3, result: "Zombie Cricket (3/3)" },
  ])("at level $level summons a $level/$level Zombie Cricket", ({ level, result}) => {
    const { steps } = simulateBattle(
      [petLevel("Cricket", 1, 1, level)],
      [pet("Sloth", 1, 1)],
      PET_REGISTRY
    );

    expect(petToString(steps[1].attackerTeam[0])).toBe(result);
  });
});

describe("Horse — friend-summoned", () => {
  it.each([
    { level: 1, result: "Zombie Cricket (2/1)" },
    { level: 2, result: "Zombie Cricket (3/1)" },
    { level: 3, result: "Zombie Cricket (4/1)" },
  ])("gives summoned pets +$level attack at level $level", ({ level, result }) => {
    // NOTE: Test can fail due to Cricket being incorrectly implemented
    // Sloth kills Cricket, Cricket summons 1/1 Zombie Cricket, test confirms Horse provides an appropriate buff
    const { steps } = simulateBattle(
      [pet("Cricket", 1, 1), petLevel("Horse", 2, 1, level)],
      [pet("Sloth", 2, 10)],
      PET_REGISTRY
    );

    const stepAfterRound1 = steps[1];
    expect(petToString(stepAfterRound1.attackerTeam[0])).toBe(result);
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

describe("Dodo — start-of-battle", () => {
  it.each([
    { level: 1, ability: "50%", result: "Ant (3/5)" },
    { level: 2, ability: "100%", result: "Ant (5/5)" },
    { level: 3, ability: "150%", result: "Ant (7/5)" },
  ])("gives $ability of its attack to the nearest friend ahead at level $level", ({ level, result }) => {
    const { steps } = simulateBattle(
      [pet("Sloth", 1, 5), pet("Ant", 1, 5), petLevel("Dodo", 4, 2, level)],
      [pet("Sloth", 1, 50)],
      PET_REGISTRY
    );

    expect(petToString(steps[0].attackerTeam[1])).toBe("Ant (1/5)");
    expect(petToString(steps[1].attackerTeam[1])).toBe(result);
  })
});

describe("Badger — faint", () => {
  // TODO - Fix a 1/0 Sloth (should have fainted from Badger) successfully attacking opposing team
  it.fails.each([
    { level: 1, ability: "50%", allyHealth: 3 },
    { level: 2, ability: "100%", allyHealth: 6 },
    { level: 3, ability: "150%", allyHealth: 9 },
  ])("deals $ability of attack as damage to adjacent friends ahead and behind on faint at level $level", ({ level, allyHealth }) => {
    // NOTE: Test can fail due to Dolphin being incorrectly implemented
    // Test checks if Dolphin targets Badger, and Badger kills adjacent units to guarantee a DRAW

    const friendAhead = pet("Sloth", 1, allyHealth);
    const friendBehind = pet("Sloth", 1, allyHealth);
    const { result } = simulateBattle(
      [friendBehind, petLevel("Badger", 6, 1, level), friendAhead],
      [pet("Dolphin", 1, 1)],
      PET_REGISTRY
    );

    expect(result).toBe("LOSE");
  })

  // TODO - Consider changing to verify if enemy is hit, once logic is implemented
  it("deals splash damage to closest friend behind on faint", () => {
    const { result, steps } = simulateBattle(
      [pet("Badger", 6, 1), pet("Sloth", 1, 5), pet("Sloth", 1, 5)],
      [pet("Sloth", 5, 1)],
      PET_REGISTRY,
    );
    // Badger (6/1) and the enemy Sloth (5/1) trade and both die.
    // Badger's faint: no friend ahead, friend behind takes 3 dmg → 1/2.
    expect(result).toBe("WIN");
    expect(steps[1].attackerTeam[0].health).toBe(2);
  });
});

describe("Dolphin — start-of-battle", () => {
  it.each([
    { level: 1, result: "Sloth (1/45)" },
    { level: 2, result: "Sloth (1/41)" },
    { level: 3, result: "Sloth (1/37)" }
  ])(
    "deals 4 damage to the lowest-health enemy before combat begins, $level times at level $level", (
      { level, result}) => {
    const { steps } = simulateBattle(
      [petLevel("Dolphin", 4, 3, level)],
      [pet("Sloth", 1, 49), pet("Sloth", 1, 50)],
      PET_REGISTRY
    );

    expect(steps[1].description).toContain(result)
  });

  it("repeats the hit `level` times, re-targeting whichever enemy is currently lowest health", () => {
    const { result } = simulateBattle(
      [petLevel("Dolphin", 1, 1, 2)],
      [pet("Sloth", 1, 4), pet("Sloth", 1, 4)],
      PET_REGISTRY,
    );
    // Level 2 hits the lowest-health enemy twice: the first Sloth dies, then
    // the second (now lowest) is targeted too — both die pre-combat.
    expect(result).toBe("WIN");
  });
});

describe("Skunk — start-of-battle", () => {
  it.each([
    { level: 1, effect: "33%", result: "Sloth (1/6)" },
    { level: 2, effect: "66%", result: "Sloth (1/3)" },
    { level: 3, effect: "99%", result: "Sloth (1/1)" },
  ])("reduces the highest-health enemy's health by $effect at level $level, rounded up", ({ level, result }) => {
    const { steps } = simulateBattle(
      [petLevel("Skunk", 3, 5, level)],
      [pet("Sloth", 1, 10)],
      PET_REGISTRY
    );

    expect(steps[1].description).toContain(result);
  });

  it("cannot reduce a pet's health below 1", () => {
    const { steps } = simulateBattle(
      [pet("Skunk", 3, 5)],
      [pet("Sloth", 1, 1)],
      PET_REGISTRY,
    );
    expect(steps[1].description).toContain("Sloth (1/1)");
  });
});

describe("Crab — start-of-battle", () => {
  it.each([
    { level: 1, effect: "25%", result: "Crab (4/6)" },
    { level: 2, effect: "50%", result: "Crab (4/11)" },
    { level: 3, effect: "75%", result: "Crab (4/16)" },
  ])(
    "gains health equal to $effect of its healthiest friend's health at level $level",
    ({ level, result }) => {
      const { steps } = simulateBattle(
        [petLevel("Crab", 4, 1, level), pet("Sloth", 1, 20)],
        [pet("Sloth", 1, 50)],
        PET_REGISTRY
      );

      expect(steps[1].description).toContain(result);
    }
  );

  it("no-op when there are no friends", () => {
    const { steps } = simulateBattle(
      [pet("Crab", 4, 1)],
      [pet("Sloth", 1, 50)],
      PET_REGISTRY,
    );
    expect(steps[1].description).toContain("Crab (4/1)");
  });
});

describe("Leopard — start-of-battle", () => {
  it.each([
    { level: 1, expected: "LOSS" },
    { level: 2, expected: "DRAW" },
    { level: 3, expected: "WIN" },
  ])("snipes %level pets at level $level", ({ level, expected }) => {
    const { result } = simulateBattle(
      [petLevel("Leopard", 2, 2, level)],
      [pet("Sloth", 2, 1), pet("Sloth", 2, 1), pet("Sloth", 2, 1)],
      PET_REGISTRY
    );

    expect(result).toBe(expected);
  });

  it("snipes deal 50% of attack damage", () => {
    const { steps } = simulateBattle(
      [pet("Leopard", 10, 4)],
      [pet("Sloth", 1, 10)],
      PET_REGISTRY,
    );

    expect(steps[1].description).toContain("Sloth (1/5)");
  });
});

describe("Boar — before-attack", () => {
  it.each([
    { level: 1, ability: "+4/+2", result: "Boar (14/8)" },
    { level: 2, ability: "+8/+4", result: "Boar (18/10)" },
    { level: 3, ability: "+12/+6", result: "Boar (22/12)" },
  ])("gains $ability before attack at level $level", ({ level, result }) => {
    const { steps } = simulateBattle(
      [petLevel("Boar", 10, 6, level)],
      [pet("Sloth", 1, 100)],
      PET_REGISTRY
    );

    expect(steps[1].description).toContain(result);
  });

  it("retriggers", () => {
    const { steps } = simulateBattle(
      [pet("Boar", 10, 6)],
      [pet("Sloth", 1, 100)],
      PET_REGISTRY
    );

    expect(steps[1].description).toContain('Boar (14/8)');
    expect(steps[2].description).toContain('Boar (18/9)');
    expect(steps[3].description).toContain("Boar (22/10)");
    expect(steps[4].description).toContain("Boar (26/11)");
  });
});

describe("Hippo — knock-out", () => {
  it.each([
    { level: 1, ability: "+3/+3", result: "Hippo (7/9)" },
    { level: 2, ability: "+6/+6", result: "Hippo (10/12)" },
    { level: 3, ability: "+9/+9", result: "Hippo (13/15)" },
  ])(
    "gains $ability per knock-out at level $level",
    ({ level, result }) => {
      const { steps } = simulateBattle(
        [petLevel("Hippo", 4, 7, level)],
        [pet("Sloth", 1, 1)],
        PET_REGISTRY
      );

      expect(petToString(steps[1].attackerTeam[0])).toBe(result);
    }
  );

  it("is capped at 3 triggers per battle", () => {
      const { steps } = simulateBattle(
        [pet("Hippo", 4, 7)],
        [
          pet("Sloth", 1, 1),
          pet("Sloth", 1, 1),
          pet("Sloth", 1, 1),
          pet("Sloth", 1, 1),
          pet("Sloth", 1, 1),
        ],
        PET_REGISTRY
      );

      const lastStep = steps[steps.length - 1];
      expect(petToString(lastStep.attackerTeam[0])).toContain("Hippo (13/11)");
    }
  );
});

describe("Rhino — knock-out", () => {
  const RHINO_ABILITY_DAMAGE = 4;
  const TIER_1_MULTIPLIER = 2;

  it.each([
    { level: 1, ability_damage: RHINO_ABILITY_DAMAGE },
    { level: 2, ability_damage: RHINO_ABILITY_DAMAGE * 2 },
    { level: 3, ability_damage: RHINO_ABILITY_DAMAGE * 3 },
  ])("deals $ability_damage damage to next non-tier 1 enemy at level $level", ({ level }) => {
    const { steps } = simulateBattle(
      [petLevel("Rhino", 6, 7, level)],
      [pet("Sloth", 1, 1), pet("Dodo", 1, 50)],
      PET_REGISTRY
    );

    expect(steps[1].defenderTeam[0].health).toBe(50 - 4 * level);
  });

  it.each([
    { level: 1, ability_damage: TIER_1_MULTIPLIER * RHINO_ABILITY_DAMAGE },
    { level: 2, ability_damage: TIER_1_MULTIPLIER * RHINO_ABILITY_DAMAGE * 2 },
    { level: 3, ability_damage: TIER_1_MULTIPLIER * RHINO_ABILITY_DAMAGE * 3 },
  ])(
    "deals $ability_damage damage to next non-tier 1 enemy at level $level",
    ({ level }) => {
      const { steps } = simulateBattle(
        [petLevel("Rhino", 6, 7, level)],
        [pet("Sloth", 1, 1), pet("Sloth", 1, 50)],
        PET_REGISTRY
      );

      expect(steps[1].defenderTeam[0].health).toBe(50 - 8 * level);
    }
  );
});

describe("Crocodile — start-of-battle", () => {
  it.each([1, 2, 3])(
    "deals 8 damage to the last enemy, repeated %i times at level $level",
    (level) => {
      const { steps } = simulateBattle(
        [petLevel("Crocodile", 8, 4, level)],
        [pet("Sloth", 1, 30), pet("Sloth", 1, 30)],
        PET_REGISTRY
      );

      expect(steps[1].defenderTeam[1].health).toBe(30 - level * 8);
    }
  );

  it("deals repeated damage separately", () => {
    const { steps } = simulateBattle(
      [petLevel("Crocodile", 8, 4, 2)],
      [pet("Sloth", 1, 20), pet("Sloth", 1, 8)],
      PET_REGISTRY,
    );

    // Level 2 hits the last enemy (8 hp) once, killing it, then re-targets
    // the new last enemy (20 hp) for the second hit: 20 - 8 = 12. Round 1's
    // own attack (8 more) then brings it to 4 by the time this step is captured.
    expect(steps[0].defenderTeam).toHaveLength(2);
    expect(steps[1].defenderTeam).toHaveLength(1);
    expect(steps[1].defenderTeam[0].health).toBe(4);
  });
});

describe("Tiger — ability repeat", () => {
  // TODO - Tiger only triggers the friend ahead at level 2, for some reason
  it.fails.each([
    { level: 1, result: "Sloth (3/5)" },
    { level: 2, result: "Sloth (5/5)" },
    { level: 3, result: "Sloth (7/5)" },
    ])(
    "makes the friend directly ahead repeat their battle ability at level $level",
    ({ level, result }) => {
      const { steps } = simulateBattle(
        [pet("Sloth", 1, 5), pet("Dodo", 4, 2), petLevel("Tiger", 6, 4, level)],
        [pet("Sloth", 1, 50)],
        PET_REGISTRY
      );

      expect(steps[1].description).toContain(result);
    }
  );
});

describe("Peanut perk — lethal on hit", () => {
  it("knocks out any pet it hits in combat, regardless of raw damage", () => {
    const scorpion = pet("Scorpion", 1, 3, "Peanut");
    const { result, steps } = simulateBattle([scorpion], [pet("Sloth", 1, 100)], PET_REGISTRY);
    expect(result).toBe("WIN");
    expect(steps).toHaveLength(2); // Battle start + 1 round: the single hit is lethal
  });

  it("does not trigger from a 0-attack pet (no connecting hit)", () => {
    const scorpion = pet("Scorpion", 0, 3, "Peanut");
    const { result } = simulateBattle(
      [scorpion],
      [pet("Sloth", 1, 5)],
      PET_REGISTRY
    );
    expect(result).toBe("LOSS");
  });
});

describe("Garlic perk — damage reduction", () => {
  it("reduces incoming damage by 2", () => {
    const garlicSloth: PetInstance = { type: "Sloth", attack: 1, health: 10, perk: "Garlic", xp: 1, level: 1 };
    const { steps } = simulateBattle([garlicSloth], [pet("Sloth", 5, 5)], PET_REGISTRY);
    expect(steps[1].attackerTeam[0].health).toBe(7); // 10 - (5-2)
  });

  it("never reduces damage below 2, even against a weak attacker", () => {
    const garlicSloth: PetInstance = { type: "Sloth", attack: 1, health: 10, perk: "Garlic", xp: 1, level: 1 };
    const { steps } = simulateBattle([garlicSloth], [pet("Sloth", 1, 5)], PET_REGISTRY);
    expect(steps[1].attackerTeam[0].health).toBe(8); // max(2, 1-2) = 2 taken
  });
});

describe("Melon perk — damage block", () => {
  it("blocks up to 20 damage on the first hit, then clears", () => {
    const melonSloth: PetInstance = { type: "Sloth", attack: 1, health: 10, perk: "Melon", xp: 1, level: 1 };
    const { steps } = simulateBattle([melonSloth], [pet("Sloth", 5, 100)], PET_REGISTRY);
    expect(steps[1].attackerTeam[0].health).toBe(10);
    expect(steps[1].attackerTeam[0].perk).toBeNull();
  });

  it("blocks exactly 20 and lets the remainder through on a bigger hit", () => {
    const melonSloth: PetInstance = { type: "Sloth", attack: 1, health: 10, perk: "Melon", xp: 1, level: 1 };
    const { steps } = simulateBattle([melonSloth], [pet("Sloth", 21, 100)], PET_REGISTRY);
    expect(steps[1].attackerTeam[0].health).toBe(9); // 10 - (21-20)
  });

  it("no longer blocks a second hit once used up", () => {
    const melonSloth: PetInstance = { type: "Sloth", attack: 1, health: 30, perk: "Melon", xp: 1, level: 1 };
    const { steps } = simulateBattle([melonSloth], [pet("Sloth", 5, 100)], PET_REGISTRY);
    expect(steps[1].attackerTeam[0].health).toBe(30); // round 1: blocked
    expect(steps[2].attackerTeam[0].health).toBe(25); // round 2: perk gone, takes 5
  });
});

describe("Peanut + Melon interaction", () => {
  it("a fully-blocked hit does not count as a Peanut kill", () => {
    const scorpion = pet("Scorpion", 1, 3, "Peanut");
    const melonSloth: PetInstance = { type: "Sloth", attack: 1, health: 10, perk: "Melon", xp: 1, level: 1 };
    const { steps } = simulateBattle([scorpion], [melonSloth], PET_REGISTRY);
    // Scorpion's 1 dmg is fully blocked (min(20,1)=1) — Sloth takes 0, so it
    // wasn't "hurt" and Peanut's instakill does not apply.
    expect(steps[1].defenderTeam[0].health).toBe(10);
  });
});

describe("Ability order — same-trigger pets fire highest attack first", () => {
  it("start-of-battle resolves by attack, not board position", () => {
    // Board order is A, B, C (A frontmost), but attack order is C > B > A.
    // Dodo gives 50% of its OWN current attack to the friend ahead, so firing
    // order changes the final numbers: if C fires before B, B is boosted
    // before it hands anything to A.
    const dodoA = pet("Dodo", 1, 5);
    const dodoB = pet("Dodo", 4, 5);
    const dodoC = pet("Dodo", 10, 5);
    const { steps } = simulateBattle(
      [dodoA, dodoB, dodoC],
      [pet("Sloth", 0, 100)],
      PET_REGISTRY,
    );
    const afterRound1 = steps[1].attackerTeam;
    // Attack-order firing: C (10 atk) first -> gives round(10*0.5)=5 to B -> B is 9.
    // Then B (now 9 atk) -> gives round(9*0.5)=5 to A -> A is 6.
    // (Board-order firing would instead process A first (no-op, nothing ahead),
    // then B at its original 4 atk -> A would only reach 1+2=3.)
    expect(afterRound1[2].attack).toBe(10); // Dodo C — nobody targets the back
    expect(afterRound1[1].attack).toBe(9); // Dodo B — boosted by C first
    expect(afterRound1[0].attack).toBe(6); // Dodo A — only reachable via attack order
  });
});

describe("engine fix — start-of-battle deaths route through faint", () => {
  it("Badger's faint ability fires even when it dies during the start-of-battle phase", () => {
    const { steps } = simulateBattle(
      [pet("Sloth", 1, 5), pet("Badger", 6, 1)],
      [pet("Dolphin", 4, 3)],
      PET_REGISTRY,
    );
    // Dolphin's start-of-battle hit (4 dmg) kills the low-health Badger
    // before combat begins. Badger's faint ability must still fire, dealing
    // 3 dmg (50% of 6) to the Sloth ahead of it: 5 - 3 = 2.
    expect(steps[1].description).toContain("Sloth (1/2)");
  });
});
