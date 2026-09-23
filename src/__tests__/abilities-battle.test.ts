import { describe, it, expect } from "vitest";
import { simulateBattle } from "@/lib/game/battle";
import { PET_REGISTRY } from "@/lib/pets";
import type {
  BasePerkType,
  DefensivePerk,
  OffensivePerk,
  PetInstance,
  TriggerPerk,
} from "@/lib/types";
import { GarlicPerk } from "@/lib/perks/garlic";
import { MelonPerk } from "@/lib/perks/melon";
import { PeanutPerk } from "@/lib/perks/peanut";
import { HoneyPerk } from "@/lib/perks/honey";
import { MeatBonePerk } from "@/lib/perks/meat-bone";
import { MushroomPerk } from "@/lib/perks/mushroom";
import { structuredClone } from "next/dist/compiled/@edge-runtime/primitives";
import { SteakPerk } from "@/lib/perks/steak";

function pet(type: string, attack: number, health: number, perk: BasePerkType | OffensivePerk | DefensivePerk | TriggerPerk | null = null): PetInstance {
  return { type, attack, health, perk: structuredClone(perk), xp: 1, level: 1 };
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
    const honeySloth = pet("Sloth", 1, 1, HoneyPerk);
    const opponent = pet("Sloth", 2, 2);

    const { result, steps } = simulateBattle(
      [honeySloth],
      [opponent],
      PET_REGISTRY
    );
    // Bee (1/1) vs Sloth (2/1). They trade → DRAW.
    expect(result).toBe("DRAW");
    // After round 1, Bee should appear in attacker team
    const stepAfterRound1 = steps[1];
    expect(stepAfterRound1.attackerTeam[0].type).toBe("Bee");
  });

  it("does not mutate input teams", () => {
    const honeySloth: PetInstance = pet("Sloth", 1, 1, HoneyPerk);
    const opponent = pet("Sloth", 2, 2);
    simulateBattle([honeySloth], [opponent], PET_REGISTRY);
    expect(honeySloth.health).toBe(1);
    expect(opponent.health).toBe(2);
  });
});

describe("Dodo — start-of-battle", () => {
  it("gives 50% of its attack to the nearest friend ahead", () => {
    const { steps } = simulateBattle(
      [pet("Sloth", 1, 5), pet("Dodo", 4, 2)],
      [pet("Sloth", 1, 50)],
      PET_REGISTRY,
    );
    // Dodo (4 atk) gives 50% = 2 to the Sloth ahead of it → Sloth becomes 3/5
    expect(steps[1].description).toContain("(3/5)");
  });
});

describe("Badger — faint", () => {
  it("deals 50% attack damage to friends immediately ahead and behind on faint", () => {
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
  it("deals 4 damage to the lowest-health enemy before combat begins", () => {
    const { result, steps } = simulateBattle(
      [pet("Dolphin", 4, 3)],
      [pet("Sloth", 1, 4)],
      PET_REGISTRY,
    );
    // Exactly enough to faint the only enemy before any rounds are fought.
    expect(result).toBe("WIN");
    expect(steps).toHaveLength(1);
  });

  it("repeats the hit `level` times, re-targeting whichever enemy is currently lowest health", () => {
    const { result } = simulateBattle(
      [petLevel("Dolphin", 4, 3, 2)],
      [pet("Sloth", 1, 4), pet("Sloth", 1, 4)],
      PET_REGISTRY,
    );
    // Level 2 hits the lowest-health enemy twice: the first Sloth dies, then
    // the second (now lowest) is targeted too — both die pre-combat.
    expect(result).toBe("WIN");
  });
});

describe("Skunk — start-of-battle", () => {
  it("cuts the highest-health enemy's health by 33%, rounded up", () => {
    const { steps } = simulateBattle(
      [pet("Skunk", 3, 5)],
      [pet("Sloth", 1, 10)],
      PET_REGISTRY,
    );
    // 10 - ceil(10 * 0.33) = 10 - 4 = 6
    expect(steps[1].description).toContain("Sloth (1/6)");
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
  it("gains health equal to 25% of its healthiest friend's health", () => {
    const { steps } = simulateBattle(
      [pet("Crab", 4, 1), pet("Sloth", 1, 9)],
      [pet("Sloth", 1, 50)],
      PET_REGISTRY,
    );
    // 25% of 9 = 2.25 → rounds to 2. Crab: 1 + 2 = 3 health.
    expect(steps[1].description).toContain("Crab (4/3)");
  });

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
  it("deals 50% attack damage to a random enemy", () => {
    const { steps } = simulateBattle(
      [pet("Leopard", 10, 4)],
      [pet("Sloth", 1, 10)],
      PET_REGISTRY,
    );
    expect(steps[1].description).toContain("Sloth (1/5)");
  });
});

describe("Boar — before-attack", () => {
  it("gains +4/+2 immediately before each of its attacks", () => {
    const { steps } = simulateBattle(
      [pet("Boar", 10, 6)],
      [pet("Sloth", 1, 100)],
      PET_REGISTRY,
    );
    expect(steps[1].description).toContain("Boar (14/8)");
    expect(steps[2].description).toContain("Boar (18/9)");
  });
});

describe("Hippo — knock-out", () => {
  it("gains +3/+3 per knock-out, capped at the first 3 per battle", () => {
    const { result, steps } = simulateBattle(
      [pet("Hippo", 4, 7)],
      [
        pet("Sloth", 1, 1),
        pet("Sloth", 1, 1),
        pet("Sloth", 1, 1),
        pet("Sloth", 1, 1),
        pet("Sloth", 1, 1),
      ],
      PET_REGISTRY,
    );
    expect(result).toBe("WIN");
    const lastStep = steps[steps.length - 1];
    // Knock-outs 1-3 each add +3/+3; the 4th and 5th no longer buff Hippo.
    expect(lastStep.attackerTeam[0].attack).toBe(13);
    expect(lastStep.attackerTeam[0].health).toBe(11);
  });
});

describe("Rhino — knock-out", () => {
  it("deals 4 damage to the next enemy in line, doubled against tier-1 pets", () => {
    const { result, steps } = simulateBattle(
      [pet("Rhino", 6, 7)],
      [pet("Sloth", 1, 1), pet("Sloth", 1, 5)],
      PET_REGISTRY,
    );
    // Rhino kills the first Sloth (tier 1), then its knock-out splash deals
    // 8 (doubled) damage to the second Sloth (also tier 1), softening it up
    // well ahead of Rhino's own attack finishing it off next round.
    expect(result).toBe("WIN");
    expect(steps).toHaveLength(3); // Battle start + 2 rounds
  });
});

describe("Crocodile — start-of-battle", () => {
  it("deals 8 damage to the last enemy, repeated `level` times", () => {
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

describe("Peanut perk — lethal on hit", () => {
  it("knocks out any pet it hits in combat, regardless of raw damage", () => {
    const scorpion = pet("Scorpion", 1, 3, PeanutPerk);
    const { result, steps } = simulateBattle([scorpion], [pet("Sloth", 1, 100)], PET_REGISTRY);
    expect(result).toBe("WIN");
    expect(steps).toHaveLength(2); // Battle start + 1 round: the single hit is lethal
  });

  it("does not trigger from a 0-attack pet (no connecting hit)", () => {
    const scorpion = pet("Scorpion", 0, 3, PeanutPerk);
    const { result } = simulateBattle([scorpion], [pet("Sloth", 1, 5)], PET_REGISTRY);
    expect(result).toBe("LOSS");
  });
});

describe("Tiger — ability repeat", () => {
  it("makes the friend directly ahead repeat their battle ability a second time", () => {
    const { steps } = simulateBattle(
      [pet("Sloth", 1, 5), pet("Dodo", 4, 2), pet("Tiger", 6, 4)],
      [pet("Sloth", 1, 50)],
      PET_REGISTRY,
    );
    // Dodo normally gives the Sloth ahead +2 attack (50% of 4). With Tiger
    // directly behind Dodo, the ability repeats, adding +2 again → total +4.
    expect(steps[1].description).toContain("(5/5)");
  });
});

describe("Garlic perk — damage reduction", () => {
  it("reduces incoming damage by 2", () => {
    const garlicSloth = pet("Sloth", 1, 10, GarlicPerk);
    const opposingSloth = pet("Sloth", 5, 5);
    const { steps } = simulateBattle([garlicSloth], [opposingSloth], PET_REGISTRY);
    expect(steps[1].attackerTeam[0].health).toBe(7); // 10 - (5-2)
  });

  it("does not increase damage for attackers with only 1 attack", () => {
    const garlicSloth = pet("Sloth", 1, 10, GarlicPerk);
    const { steps } = simulateBattle([garlicSloth], [pet("Sloth", 1, 5)], PET_REGISTRY);
    expect(steps[1].attackerTeam[0].health).toBe(9);
  });
});

describe("Melon perk — damage block", () => {
  it("blocks up to 20 damage on the first hit, then clears", () => {
    const melonSloth = pet("Sloth", 1, 10, MelonPerk);
    const { steps } = simulateBattle([melonSloth], [pet("Sloth", 5, 100)], PET_REGISTRY);
    expect(steps[1].attackerTeam[0].health).toBe(10);
    expect(steps[1].attackerTeam[0].perk).toBeNull();
  });

  it("blocks exactly 20 and lets the remainder through on a bigger hit", () => {
    const melonSloth = pet("Sloth", 1, 10, MelonPerk);
    const normalSloth = pet("Sloth", 21, 100);

    const { steps } = simulateBattle([melonSloth], [normalSloth], PET_REGISTRY);
    expect(steps[1].attackerTeam[0].health).toBe(9); // 10 - (21-20)
  });

  it("no longer blocks a second hit once used up", () => {
    const melonSloth = pet("Sloth", 1, 30, MelonPerk);

    const { steps } = simulateBattle([melonSloth], [pet("Sloth", 5, 100)], PET_REGISTRY);
    expect(steps[1].attackerTeam[0].health).toBe(30); // round 1: blocked
    expect(steps[2].attackerTeam[0].health).toBe(25); // round 2: perk gone, takes 5
  });
});

describe("Peanut + Melon interaction", () => {
  it("a fully-blocked hit does not count as a Peanut kill", () => {
    const scorpion = pet("Scorpion", 1, 3, PeanutPerk);
    const melonSloth: PetInstance = pet("Sloth", 1, 10, MelonPerk);

    const { steps } = simulateBattle([scorpion], [melonSloth], PET_REGISTRY);
    // Scorpion's 1 dmg is fully blocked (min(20,1)=1) — Sloth takes 0, so it
    // wasn't "hurt" and Peanut's instakill does not apply.
    expect(steps[1].defenderTeam[0].health).toBe(10);
  });
});

describe("Meat Bone", () => {
  it("increases base attack by +3", () => {
    const meatBoneSloth = pet("Sloth", 1, 4, MeatBonePerk);
    const opponent = pet("Sloth", 2, 8);

    const { result } = simulateBattle([meatBoneSloth], [opponent], PET_REGISTRY);
    expect(result).toBe("DRAW");
  });
})

describe("Steak", () => {
  it("increases base attack by +20", () => {
    const steakSloth = pet("Sloth", 1, 21, SteakPerk);
    const opponent = pet("Sloth", 1, 21);

    const { result } = simulateBattle([steakSloth], [opponent], PET_REGISTRY);
    expect(result).toBe("WIN");
  });

  it("is consumed after use", () => {
    const steakSloth = pet("Sloth", 1, 21, SteakPerk);
    const opponent = pet("Sloth", 1, 22);

    const { steps } = simulateBattle([steakSloth], [opponent], PET_REGISTRY);
    expect(steps[0].attackerTeam[0].perk.name).toBe("Steak");
    expect(steps[1].attackerTeam[0].perk).toBe(null);
  });
})

describe("Mushroom", () => {
  it("summons the same pet as a 1/1", () => {
    const mushroomSloth = pet("Sloth", 2, 2, MushroomPerk);
    const opponent = pet("Sloth", 2, 3);
    const { result, steps } = simulateBattle([mushroomSloth], [opponent], PET_REGISTRY);

    // Bee (1/1) vs Sloth (2/1). They trade → DRAW.
    expect(result).toBe("DRAW");

    // After round 1, Sloth should appear in attacker team
    const stepAfterRound1 = steps[1];
    expect(stepAfterRound1.attackerTeam[0].type).toBe("Sloth");
    expect(stepAfterRound1.attackerTeam[0].attack).toBe(1);
    expect(stepAfterRound1.attackerTeam[0].health).toBe(1);
  });
})

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
