import { describe, it, expect } from "vitest";
import { PET_REGISTRY } from "@/lib/pets";
import { petToString } from "@/lib/utils/flavor-text";
import type {
  BattleAbilityContext,
  PetData,
} from "@/lib/types";
import { Trigger } from "@/lib/types";
import { grantExperience } from "@/lib/game/merge";
import { GarlicPerk } from "@/lib/perks/garlic";
import { MelonPerk } from "@/lib/perks/melon";
import { PeanutPerk } from "@/lib/perks/peanut";
import { HoneyPerk } from "@/lib/perks/honey";
import { MeatBonePerk } from "@/lib/perks/meat-bone";
import { MushroomPerk } from "@/lib/perks/mushroom";
import { SteakPerk } from "@/lib/perks/steak";
import { Ox } from "@/lib/pets/turtle/tier 3/ox";
import { abilityPet, pet, registryWith } from "./helpers";

function battleContext(
  self: PetData,
  team: PetData[],
  enemyTeam: PetData[]
): BattleAbilityContext {
  return {
    self,
    selfIndex: team.indexOf(self),
    team,
    enemyTeam,
    level: self.level,
    summon: () => {},
    triggerCount: 1,
    petRegistry: PET_REGISTRY,
    dealAbilityDamage: (target, damage) => {
      if (target.health <= 0) return 0;
      target.health -= damage;
      return damage;
    },
    grantExperience,
    friendAteFood: () => {},
  };
}

describe("Pet Abilities", () => {






  describe("Rooster — faint", () => {
    it.each([
      { level: 1, expected: ["Chick (3/1)"] },
      { level: 2, expected: ["Chick (3/1)", "Chick (3/1)"] },
      { level: 3, expected: ["Chick (3/1)", "Chick (3/1)", "Chick (3/1)"] },
    ])("summons $level Chick tokens with half its attack at level $level", ({ level, expected }) => {
      const { steps } = simulateBattle(
        [pet({ type: "Rooster",  attack: 6, level })],
        [pet()],
        PET_REGISTRY
      );

      expect(steps[1].summary.playerTeam
        .filter(p => p !== null)
        .map(petToString))
        .toEqual(expected);
    });

    it("rounds half its attack down", () => {
      const { steps } = simulateBattle(
        [pet({ type: "Rooster",  attack: 5 })],
        [pet()],
        PET_REGISTRY
      );

      expect(petToString(steps[1].summary.playerTeam[0]!)).toBe("Chick (2/1)");
    });

    it("does not summon a Chick with 0 attack", () => {
      const { steps } = simulateBattle(
        [pet({ type: "Rooster",  attack: 1 })],
        [pet()],
        PET_REGISTRY
      );

      expect(steps[1].summary.playerTeam).toHaveLength(0);
    });
  });

  describe("Mammoth — faint", () => {
    it("buffs living friends but not itself or pending faints", () => {
      const mammoth = pet({ type: "Mammoth",  health: 0 });
      const deadFriend = pet({ health: 0 });
      const livingFriend = pet();
      const ability = PET_REGISTRY.Mammoth.ability;
      if (ability?.trigger !== Trigger.faint) throw new Error("Expected faint ability");

      ability.fn(battleContext(mammoth, [mammoth, deadFriend, livingFriend], []));

      expect(mammoth.health).toBe(0);
      expect(deadFriend.health).toBe(0);
      expect(livingFriend).toMatchObject({ attack: 3, health: 3 });
    });
  });

  describe("Ox — friend ahead faints", () => {

    it("gains Melon and +1 attack when its friend ahead faints", () => {
      const { steps } = simulateBattle(
        [pet(), pet({ type: "Ox" })],
        [pet()],
        registryWith(Ox)
      );

      expect(petToString(steps[1].summary.playerTeam[0]!)).toBe("Ox (2/1)");
      expect(steps[1].summary.playerTeam[0]?.perk?.name).toBe("Melon");
    });

    it.skip.each([
      { level: 1 },
      { level: 2 },
      { level: 3 },
    ])("triggers at most $level at level $level", () => {})

    it("does not trigger when a friend further ahead faints", () => {
      const { steps } = simulateBattle(
        [pet(), pet(), pet({ type: "Ox" })],
        [pet()],
        registryWith(Ox)
      );

      expect(petToString(steps[1].summary.playerTeam[1]!)).toBe("Ox (1/1)");
      expect(steps[1].summary.playerTeam[1]?.perk).toBeNull();
    });

    it("works once per turn in battle", () => {
      const { steps } = simulateBattle(
        [pet({ perk: HoneyPerk }), pet({ type: "Ox" })],
        [pet({ health: 10 })],
        registryWith(Ox)
      );

      expect(steps[2].summary.playerTeam
        .filter(p => p !== null)
        .map(petToString))
        .toEqual(["Ox (2/1)"]);
    });

    it("does not trigger in battle after triggering in the shop that turn", () => {
      const { steps } = simulateBattle(
        [pet(), pet({ type: "Ox",  abilityActivations: 1})],
        [pet()],
        registryWith(Ox)
      );

      expect(petToString(steps[1].summary.playerTeam[0]!)).toBe("Ox (1/1)");
      expect(steps[1].summary.playerTeam[0]?.perk).toBeNull();
    });
  });

  describe("Snake — friend ahead attacks", () => {
    it.each([
      { level: 1, damage: 5, expectedHealth: 45 },
      { level: 2, damage: 10, expectedHealth: 40 },
      { level: 3, damage: 15, expectedHealth: 35 },
    ])("deals $damage damage to a random enemy at level $level", ({ level, expectedHealth }) => {
      const { steps } = simulateBattle(
        [pet({ attack: 0 }), pet({ type: "Snake",  level })],
        [pet({ attack: 0, health: 50 })],
        PET_REGISTRY
      );

      expect(steps[1].summary.opposingTeam[0]?.health).toBe(expectedHealth);
    });

    it("deals damage at most five times", () => {
      const { steps } = simulateBattle(
        [pet({ attack: 0 }), pet({ type: "Snake" })],
        [pet({ attack: 0, health: 50 })],
        PET_REGISTRY
      );

      expect(steps.at(-1)?.summary.opposingTeam[0]?.health).toBe(25);
    });
  });

  describe("Rabbit — food gained by ability", () => {
    const tripleFeeder = abilityPet("Triple Feeder", {
      trigger: Trigger.start_of_battle,
      fn: (ctx) => {
        for (let i = 0; i < 3; i++) ctx.friendAteFood(ctx.team);
      },
    });

    it("has only the triggers left over from the shop", () => {
      const { steps } = simulateBattle(
        [pet({ type: "Triple Feeder" }), pet({ type: "Rabbit",  abilityActivations: 1 })],
        [pet({ attack: 0 })],
        registryWith(tripleFeeder)
      );

      expect(steps[1].summary.playerTeam[1]?.health).toBe(3);
    });

    // TODO: This doesn't appear to "return to the shop," and simply tests that simulateBattle doesn't mutate PetData
    it("does not carry battle triggers back to the shop", () => {
      const rabbit = pet({ type: "Rabbit",  abilityActivations: 1 });
      simulateBattle(
        [pet({ type: "Triple Feeder" }), rabbit],
        [pet()],
        registryWith(tripleFeeder)
      );

      expect(rabbit.abilityActivations).toBe(1);
    });

    it("triggers when a battle ability gives a friend a perk", () => {
      const perkGiver = abilityPet("Perk Giver", {
        trigger: Trigger.start_of_battle,
        fn: (ctx) => {
          const friend = ctx.team[1];
          if (!friend) return;
          friend.perk = MelonPerk;
          ctx.friendAteFood(friend);
        },
      });
      const { steps } = simulateBattle(
        [pet({ type: "Perk Giver" }), pet({ type: "Rabbit" })],
        [pet()],
        registryWith(perkGiver)
      );

      expect(steps[1].summary.playerTeam[0]?.health).toBe(2);
      expect(steps[1].summary.playerTeam[0]?.perk).toBe(MelonPerk);
    });
  });

  describe("Ability-granted experience", () => {
    it("still grants stats at max XP without exceeding the cap", () => {
      const experienceGiver = abilityPet("Experience Giver", {
        trigger: Trigger.start_of_battle,
        fn: (ctx) => {
          const target = ctx.team[1];
          if (target) ctx.grantExperience(target, 1);
        },
      });
      const { steps } = simulateBattle(
        [pet({ type: "Experience Giver" }), pet({ xp: 5, level: 3 })],
        [pet({ attack: 0 })],
        registryWith(experienceGiver)
      );

      expect(steps[1].summary.playerTeam[1]).toMatchObject({
        attack: 2,
        health: 2,
        xp: 5,
        level: 3,
      });
    });
  });

  describe("Abilities cannot target pending faints", () => {
    it("does not run a pending-faint Dog's friend-summoned ability", () => {
      const summoner = abilityPet("Summoner", {
        trigger: Trigger.start_of_battle,
        fn: (ctx) => ctx.summon(pet(), ctx.selfIndex),
      });
      const { steps } = simulateBattle(
        [pet({ type: "Summoner" }), pet({ type: "Dog",  health: 0 })],
        [pet({ attack: 0 })],
        registryWith(summoner)
      );

      expect(steps[1].summary.playerTeam.some((friend) => friend?.type === "Dog")).toBe(false);
    });

    it("Mosquito only selects enemies with health remaining", () => {
      const deadEnemy = pet({ health: 0 });
      const livingEnemy = pet({ health: 10 });
      const mosquito = pet({ type: "Mosquito" });
      const ability = PET_REGISTRY.Mosquito.ability;
      if (ability?.trigger !== Trigger.start_of_battle) throw new Error("Expected Mosquito start-of-battle ability");

      ability.fn(battleContext(mosquito, [mosquito], [deadEnemy, livingEnemy]));

      expect(deadEnemy.health).toBe(0);
      expect(livingEnemy.health).toBe(9);
    });

    it("Elephant skips a pending faint and targets the nearest living friend behind", () => {
      const elephant = pet({ type: "Elephant" });
      const deadFriend = pet({ health: 0 });
      const livingFriend = pet({ health: 10 });
      const team = [elephant, deadFriend, livingFriend];
      const ability = PET_REGISTRY.Elephant.ability;
      if (ability?.trigger !== Trigger.after_attack) throw new Error("Expected Elephant after-attack ability");

      ability.fn(battleContext(elephant, team, []));

      expect(deadFriend.health).toBe(0);
      expect(livingFriend.health).toBe(9);
    });
  });

  describe("Mosquito — start-of-battle", () => {
    it.each([
      { level: 1, expected: "LOSS" },
      { level: 2, expected: "DRAW" },
      { level: 3, expected: "WIN" },
    ])(
      "deals 1 random damage to $level random enemy at level $level at start of battle",
      ({ level, expected }) => {
        const { result } = simulateBattle(
          [pet({ type: "Mosquito",  level })],
          [pet(), pet(), pet()],
          PET_REGISTRY
        );

        expect(result).toBe(expected);
      }
    );
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
          [pet({ type: "Ant",  level }), pet()],
          [pet()],
          PET_REGISTRY
        );

        expect(petToString(steps[1].summary.playerTeam[0]!)).toBe(result);
      }
    );
  });

  describe("Cricket — faint", () => {
    it.each([
      { level: 1, result: "Zombie Cricket (1/1)" },
      { level: 2, result: "Zombie Cricket (2/2)" },
      { level: 3, result: "Zombie Cricket (3/3)" },
    ])(
      "at level $level summons a $level/$level Zombie Cricket",
      ({ level, result }) => {
        const { steps } = simulateBattle(
          [pet({ type: "Cricket",  level })],
          [pet()],
          PET_REGISTRY
        );

        expect(petToString(steps[1].summary.playerTeam[0]!)).toBe(result);
      }
    );
  });

  describe("Dog — friend summoned", () => {
    it.each([
      { level: 1, ability: "+2/+1", result: "Dog (3/2)" },
      { level: 2, ability: "+4/+2", result: "Dog (5/3)" },
      { level: 3, ability: "+6/+3", result: "Dog (7/4)" },
    ])("gains $ability when a friend is summoned at level $level", ({ level, result }) => {
      const { steps } = simulateBattle(
        [pet({ type: "Cricket" }), pet({ type: "Dog",  level })],
        [pet()],
        PET_REGISTRY
      );

      expect(petToString(steps[1].summary.playerTeam[1]!)).toBe(result);
    });
  });

  describe("Turkey — friend summoned", () => {
    it.each([
      { level: 1, ability: "+3/+1", result: "Zombie Cricket (4/2)" },
      { level: 2, ability: "+6/+2", result: "Zombie Cricket (7/3)" },
      { level: 3, ability: "+9/+3", result: "Zombie Cricket (10/4)" },
    ])("gives the summoned friend $ability at level $level", ({ level, result }) => {
      const { steps } = simulateBattle(
        [pet({ type: "Cricket" }), pet({ type: "Turkey",  level })],
        [pet()],
        PET_REGISTRY
      );

      expect(petToString(steps[1].summary.playerTeam[0]!)).toBe(result);
    });
  });


  describe("Dodo — start-of-battle", () => {
    it.each([
      { level: 1, ability: "50%", result: "Ant (3/1)" },
      { level: 2, ability: "100%", result: "Ant (5/1)" },
      { level: 3, ability: "150%", result: "Ant (7/1)" },
    ])(
      "gives $ability of its attack to the nearest friend ahead at level $level",
      ({ level, result }) => {
        const { steps } = simulateBattle(
          [pet(), pet({ type: "Ant" }), pet({ type: "Dodo",  attack: 4, level })],
          [pet({ attack: 0 })],
          PET_REGISTRY
        );

        expect(petToString(steps[0].summary.playerTeam[1]!)).toBe("Ant (1/1)");
        expect(petToString(steps[1].summary.playerTeam[1]!)).toBe(result);
      }
    );
  });

  describe("Badger — faint", () => {
    // TODO - Fix a 1/0 Sloth (should have fainted from Badger) successfully attacking opposing team
    it.fails.each([
      { level: 1, ability: "50%", allyHealth: 3 },
      { level: 2, ability: "100%", allyHealth: 6 },
      { level: 3, ability: "150%", allyHealth: 9 },
    ])(
      "deals $ability of attack as damage to adjacent friends ahead and behind on faint at level $level",
      ({ level, allyHealth }) => {
        // NOTE: Test can fail due to Dolphin being incorrectly implemented
        // Test checks if Dolphin targets Badger, and Badger kills adjacent units to guarantee a DRAW

        const friendAhead = pet({ health: allyHealth });
        const friendBehind = pet({ health: allyHealth });
        const { result } = simulateBattle(
          [friendBehind, pet({ type: "Badger",  attack: 6, level }), friendAhead],
          [pet({ type: "Dolphin" })],
          PET_REGISTRY
        );

        expect(result).toBe("LOSE");
      }
    );

    it("deals splash damage to closest friend behind on faint", () => {
      const { steps } = simulateBattle(
        [pet({ type: "Badger",  attack: 6 }), pet({ health: 5 }), pet({ health: 5 })],
        [pet()],
        PET_REGISTRY
      );

      expect(steps[1].summary.playerTeam[0]?.health).toBe(2);
      expect(steps[1].summary.playerTeam[1]?.health).toBe(5);
    });

    it("hits the front enemy when it is at the front of its team", () => {
      const badger = pet({ type: "Badger",  attack: 6, health: 0 });
      const enemy = pet({ health: 10 });
      const secondEnemy = pet({ health: 10 });
      const ability = PET_REGISTRY.Badger.ability;
      if (ability?.trigger !== Trigger.faint) throw new Error("Expected Badger faint ability");

      ability.fn(battleContext(badger, [badger], [enemy, secondEnemy]));

      expect(enemy.health).toBe(7);
      expect(secondEnemy.health).toBe(10);
    });

    it("skips pending faints", () => {
      const deadFriendAhead = pet({ health: 0 });
      const badger = pet({ type: "Badger",  attack: 6, health: 0 });
      const deadFriendBehind = pet({ health: 0 });
      const livingFriendBehind = pet({ health: 10 });
      const deadEnemyFront = pet({ health: 0 });
      const livingEnemyBehind = pet({ health: 10 });
      const team = [deadFriendAhead, badger, deadFriendBehind, livingFriendBehind];
      const ability = PET_REGISTRY.Badger.ability;
      if (ability?.trigger !== Trigger.faint) throw new Error("Expected Badger faint ability");

      ability.fn(battleContext(badger, team, [deadEnemyFront, livingEnemyBehind]));

      expect(deadFriendAhead.health).toBe(0);
      expect(deadFriendBehind.health).toBe(0);
      expect(deadEnemyFront.health).toBe(0);
      expect(livingFriendBehind.health).toBe(7);
      expect(livingEnemyBehind.health).toBe(7);
    });
  });

  describe("Dolphin — start-of-battle", () => {
    it.each([
      { level: 1, result: "Sloth (1/45)" },
      { level: 2, result: "Sloth (1/41)" },
      { level: 3, result: "Sloth (1/37)" },
    ])(
      "deals 4 damage to the lowest-health enemy before combat begins, $level times at level $level",
      ({ level, result }) => {
        const { steps } = simulateBattle(
          [pet({ type: "Dolphin",  attack: 0, level })],
          [pet({ health: 49 }), pet({ health: 50 })],
          PET_REGISTRY
        );

        expect(steps[1].summary.description).toContain(result);
      }
    );

    it("repeats the hit `level` times, re-targeting whichever enemy is currently lowest health", () => {
      const { result } = simulateBattle(
        [pet({ type: "Dolphin",  level: 2 })],
        [pet({ health: 4 }), pet({ health: 4 })],
        PET_REGISTRY
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
    ])(
      "reduces the highest-health enemy's health by $effect at level $level, rounded up",
      ({ level, result }) => {
        const { steps } = simulateBattle(
          [pet({ type: "Skunk",  level })],
          [pet({ health: 10 })],
          PET_REGISTRY
        );

        expect(steps[1].summary.description).toContain(result);
      }
    );

    it("cannot reduce a pet's health below 1", () => {
      const { steps } = simulateBattle(
        [pet({ type: "Skunk" })],
        [pet()],
        PET_REGISTRY
      );
      expect(steps[1].summary.description).toContain("Sloth (1/1)");
    });
  });

  describe("Crab — start-of-battle", () => {
    it.each([
      { level: 1, effect: "25%", result: "Crab (1/6)" },
      { level: 2, effect: "50%", result: "Crab (1/11)" },
      { level: 3, effect: "75%", result: "Crab (1/16)" },
    ])(
      "gains health equal to $effect of its healthiest friend's health at level $level",
      ({ level, result }) => {
        const { steps } = simulateBattle(
          [pet({ type: "Crab",  level }), pet({ health: 20 })],
          [pet()],
          PET_REGISTRY
        );

        expect(steps[1].summary.description).toContain(result);
      }
    );

    it("no-op when there are no friends", () => {
      const { steps } = simulateBattle(
        [pet({ type: "Crab" })],
        [pet()],
        PET_REGISTRY
      );
      expect(steps[1].summary.description).toContain("Crab (1/1)");
    });
  });

  describe("Leopard — start-of-battle", () => {
    it.each([
      { level: 1, expected: "LOSS" },
      { level: 2, expected: "DRAW" },
      { level: 3, expected: "WIN" },
    ])("snipes %level pets at level $level", ({ level, expected }) => {
      const { result } = simulateBattle(
        [pet({ type: "Leopard",  attack: 2, level })],
        [pet(), pet(), pet()],
        PET_REGISTRY
      );

      expect(result).toBe(expected);
    });

    it("snipes deal 50% of attack damage", () => {
      const { steps } = simulateBattle(
        [pet({ type: "Leopard",  attack: 10 })],
        [pet({ health: 10 })],
        PET_REGISTRY
      );

      expect(steps[1].summary.description).toContain("Sloth (1/5)");
    });
  });

  describe("Boar — before-attack", () => {
    it.each([
      { level: 1, ability: "+4/+2", result: "Boar (5/3)" },
      { level: 2, ability: "+8/+4", result: "Boar (9/5)" },
      { level: 3, ability: "+12/+6", result: "Boar (13/7)" },
    ])("gains $ability before attack at level $level", ({ level, result }) => {
      const { steps } = simulateBattle(
        [pet({ type: "Boar",  level })],
        [pet({ attack: 0 })],
        PET_REGISTRY
      );

      expect(steps[1].summary.description).toContain(result);
    });

    it("retriggers", () => {
      const { steps } = simulateBattle(
        [pet({ type: "Boar" })],
        [pet({ attack: 0, health: 50})],
        PET_REGISTRY
      );

      expect(steps[1].summary.description).toContain("Boar (5/3)");
      expect(steps[2].summary.description).toContain("Boar (9/5)");
      expect(steps[3].summary.description).toContain("Boar (13/7)");
      expect(steps[4].summary.description).toContain("Boar (17/9)");
    });
  });

  describe("Hippo — knock-out", () => {
    it.each([
      { level: 1, ability: "+3/+3", result: "Hippo (4/4)" },
      { level: 2, ability: "+6/+6", result: "Hippo (7/7)" },
      { level: 3, ability: "+9/+9", result: "Hippo (10/10)" },
    ])("gains $ability per knock-out at level $level", ({ level, result }) => {
      const { steps } = simulateBattle(
        [pet({ type: "Hippo",  level })],
        [pet({ attack: 0 })],
        PET_REGISTRY
      );

      expect(petToString(steps[1].summary.playerTeam[0]!)).toBe(result);
    });

    it("is capped at 3 triggers per battle", () => {
      const { steps } = simulateBattle(
        [pet({ type: "Hippo" })],
        [
          pet({ attack: 0 }),
          pet({ attack: 0 }),
          pet({ attack: 0 }),
          pet({ attack: 0 }),
        ],
        PET_REGISTRY
      );

      const lastStep = steps[steps.length - 1];
      expect(petToString(lastStep.summary.playerTeam[0]!)).toContain("Hippo (10/10)");
    });
  });

  describe("Rhino — knock-out", () => {
    it.each([
      { level: 1, expected: 4 },
      { level: 2, expected: 8 },
      { level: 3, expected: 12 },
    ])(
      "deals $ability_damage damage to next non-tier 1 enemy at level $level",
      ({ level, expected }) => {
        const { steps } = simulateBattle(
          [pet({ type: "Rhino",  level })],
          [pet(), pet({ type: "Dodo",  health: 50 })],
          PET_REGISTRY
        );

        expect(steps[1].summary.opposingTeam[0]?.health).toBe(50 - expected);
      }
    );

    it.each([
      { level: 1, expected: 8 },
      { level: 2, expected: 16 },
      { level: 3, expected: 24 }
    ])(
      "deals $ability_damage damage to next non-tier 1 enemy at level $level",
      ({ level, expected }) => {
        const { steps } = simulateBattle(
          [pet({ type: "Rhino",  level })],
          [pet(), pet({ health: 50 })],
          PET_REGISTRY
        );

        expect(steps[1].summary.opposingTeam[0]?.health).toBe(50 - expected);
      }
    );
  });

  describe("Crocodile — start-of-battle", () => {
    it.each([1, 2, 3])(
      "deals 8 damage to the last enemy, repeated %i times at level $level",
      (level) => {
        const { steps } = simulateBattle(
          [pet({ type: "Crocodile",  level })],
          [pet({ health: 30 }), pet({ health: 30 })],
          PET_REGISTRY
        );

        expect(steps[1].summary.opposingTeam[1]?.health).toBe(30 - level * 8);
      }
    );

    it("deals repeated damage separately", () => {
      const { steps } = simulateBattle(
        [pet({ type: "Crocodile",  attack: 0, level: 3 })],
        [pet({ health: 20 }), pet({ health: 8 })],
        PET_REGISTRY
      );

      // Level 2 hits the last enemy (8 hp) once, killing it, then re-targets
      // the new last enemy (20 hp) for the second hit: 20 - 8 = 12. Round 1's
      // own attack (8 more) then brings it to 4 by the time this step is captured.
      expect(steps[0].summary.opposingTeam).toHaveLength(2);
      expect(steps[1].summary.opposingTeam).toHaveLength(1);
      expect(steps[1].summary.opposingTeam[0]?.health).toBe(4);
    });
  });

  describe("Tiger — ability repeat", () => {
    it("repeats a friend's Faint ability before that friend is removed", () => {
      const { steps } = simulateBattle(
        [pet({ type: "Ant" }), pet({ type: "Tiger" })],
        [pet()],
        PET_REGISTRY
      );

      expect(steps[1].summary.playerTeam[0]).toMatchObject({
        type: "Tiger",
        attack: 3,
        health: 3,
      });
    });

    // TODO - Tiger only triggers the friend ahead at level 2, for some reason
    it.skip.each([
      { level: 1, result: "Sloth (6/1)" },
      { level: 2, result: "Sloth (8/1)" },
      { level: 3, result: "Sloth (10/1)" },
    ])(
      "makes the friend directly ahead repeat their battle ability at level $level",
      ({ level, result }) => {
        const { steps } = simulateBattle(
          [
            pet(),
            pet({ type: "Dodo",  attack: 4 }),
            pet({ type: "Tiger",  level }),
          ],
          [pet()],
          PET_REGISTRY
        );

        expect(steps[1].summary.description).toContain(result);
      }
    );
  });
})

describe("Perks", () => {
  describe("Honey perk — faint", () => {
    it("summons a 1/1 Bee when a Honey-perked pet faints", () => {
      // Sloth with Honey 1/1 vs Sloth 2/2. Sloth takes 2 → faints. Honey triggers: Bee (1/1) appears.
      // Bee (1/1) vs Sloth (2/1). Sloth takes 1 → dies. Bee takes 2 → dies. DRAW.
      const honeySloth = pet({ perk: HoneyPerk });
      const opponent = pet({ health: 2 });

      const { result, steps } = simulateBattle(
        [honeySloth],
        [opponent],
        PET_REGISTRY
      );
      // Bee (1/1) vs Sloth (2/1). They trade → DRAW.
      expect(result).toBe("DRAW");
      // After round 1, Bee should appear in attacker team
      const stepAfterRound1 = steps[1];
      expect(stepAfterRound1.summary.playerTeam[0]?.type).toBe("Bee");
    });

    it("flings Honey's Bee when Cricket's Zombie Cricket fills the last slot", () => {
      const { steps } = simulateBattle(
        [
          pet({ type: "Cricket",  perk: HoneyPerk }),
          pet(),
          pet(),
          pet(),
          pet()
        ],
        [pet()],
        PET_REGISTRY
      );

      expect(steps[1].summary.playerTeam).toHaveLength(5);
      expect(steps[1].summary.playerTeam[0]?.type).toBe("Zombie Cricket");
      expect(steps[1].summary.playerTeam.some((friend) => friend?.type === "Bee")).toBe(false);
    });

    it("does not mutate input teams", () => {
      const honeySloth: PetData = pet({ perk: HoneyPerk });
      const opponent = pet({ attack: 2, health: 2 });
      simulateBattle([honeySloth], [opponent], PET_REGISTRY);

      expect(honeySloth.health).toBe(1);
      expect(opponent.health).toBe(2);
    });
  });

  describe("Peanut perk — lethal on hit", () => {
    it("knocks out any pet it deals damage to in combat", () => {
      const { result, steps } = simulateBattle(
        [pet({ type: "Scorpion",  health: 2, perk: PeanutPerk })],
        [pet({ health: 100 })],
        PET_REGISTRY
      );
      expect(result).toBe("WIN");
      expect(steps).toHaveLength(2); // Battle start + 1 round: the single hit is lethal
    });

    it("Peanut requires damage to kill", () => {
      const scorpion = pet({ type: "Scorpion",  perk: PeanutPerk });
      const melonSloth: PetData = pet({ perk: MelonPerk });
      const { steps } = simulateBattle([scorpion], [melonSloth], PET_REGISTRY);

      // Scorpion's 1 dmg is fully blocked (min(20,1)=1) — Sloth takes 0, so it
      // wasn't "hurt" and Peanut's instakill does not apply.
      expect(steps[1].summary.opposingTeam[0]?.health).toBe(1);
    });
  });

  describe("Garlic perk — damage reduction", () => {
    it("reduces incoming damage by 2", () => {
      const garlicSloth = pet({ health: 10, perk: GarlicPerk });
      const opposingSloth = pet({ attack: 5 });
      const { steps } = simulateBattle([garlicSloth], [opposingSloth], PET_REGISTRY);

      expect(steps[1].summary.playerTeam[0]?.health).toBe(7);
    });

    it("does not increase damage for attackers with only 1 attack", () => {
      const garlicSloth = pet({ health: 10, perk: GarlicPerk });
      const { steps } = simulateBattle([garlicSloth], [pet()], PET_REGISTRY);

      expect(steps[1].summary.playerTeam[0]?.health).toBe(9);
    });
  });

  describe("Melon perk — damage block", () => {
    it("blocks up to 20 damage on the first hit, then clears", () => {
      const melonSloth = pet({ health: 10, perk: MelonPerk });
      const { steps } = simulateBattle([melonSloth], [pet()], PET_REGISTRY);

      expect(steps[1].summary.playerTeam[0]?.health).toBe(10);
      expect(steps[1].summary.playerTeam[0]?.perk).toBeNull();
    });

    it("blocks exactly 20 and lets the remainder through on a bigger hit", () => {
      const melonSloth = pet({ health: 10, perk: MelonPerk });
      const normalSloth = pet({ attack: 21 });

      const { steps } = simulateBattle([melonSloth], [normalSloth], PET_REGISTRY);
      expect(steps[1].summary.playerTeam[0]?.health).toBe(9); // 10 - (21-20)
    });

    it("no longer blocks a second hit once used up", () => {
      const melonSloth = pet({ health: 30, perk: MelonPerk });
      const { steps } = simulateBattle([melonSloth], [pet({ attack: 5, health: 5 })], PET_REGISTRY);

      expect(steps[1].summary.playerTeam[0]?.health).toBe(30); // round 1: blocked
      expect(steps[2].summary.playerTeam[0]?.health).toBe(25); // round 2: perk gone, takes 5
    });
  });

  describe("Meat Bone", () => {
    it("increases base attack by +3", () => {
      const meatBoneSloth = pet({ attack: 1, perk: MeatBonePerk});
      const opponent = pet({ health: 4 });

      const { result } = simulateBattle([meatBoneSloth], [opponent], PET_REGISTRY);
      expect(result).toBe("DRAW");
    });
  })

  describe("Steak", () => {
    it("increases base attack by +20", () => {
      const steakSloth = pet({ attack: 1, perk: SteakPerk });
      const opponent = pet({ health: 22 });

      const { steps } = simulateBattle([steakSloth], [opponent], PET_REGISTRY);
      expect(steps[1].summary.opposingTeam[0]?.health).toBe(1);
    });

    it("is consumed after use", () => {
      const steakSloth = pet({ health: 2, perk: SteakPerk });
      const opponent = pet();

      const { steps } = simulateBattle([steakSloth], [opponent], PET_REGISTRY);
      expect(steps[0].summary.playerTeam[0]?.perk?.name).toBe("Steak");
      expect(steps[1].summary.playerTeam[0]?.perk).toBe(null);
    });
  })

  describe("Mushroom", () => {
    it("summons the same pet as a 1/1", () => {
      const mushroomSloth = pet({ health: 2, perk: MushroomPerk });
      const opponent = pet({ health: 3 });
      const { result, steps } = simulateBattle([mushroomSloth], [opponent], PET_REGISTRY);

      // Bee (1/1) vs Sloth (2/1). They trade → DRAW.
      expect(result).toBe("DRAW");

      // After round 1, Sloth should appear in attacker team
      const stepAfterRound1 = steps[1];
      expect(stepAfterRound1.summary.playerTeam[0]?.type).toBe("Sloth");
      expect(stepAfterRound1.summary.playerTeam[0]?.attack).toBe(1);
      expect(stepAfterRound1.summary.playerTeam[0]?.health).toBe(1);
    });
  });
});

describe("Engine Behavior", () => {
  // TODO - Implement test to ensure randomness between same trigger and attack

  it("Start of Battle resolves by attack, not board position", () => {
    const frontDodo = pet({ type: "Dodo",  attack: 1, level: 2 });
    const middleDodo = pet({ type: "Dodo",  attack: 12, level: 2 });
    const backDodo = pet({ type: "Dodo",  attack: 8, level: 2 });
    const { steps } = simulateBattle(
      [pet({ attack: 0 }), frontDodo, middleDodo, backDodo],
      [pet({ attack: 0 })],
      PET_REGISTRY
    );

    // Activation order should be INDEPENDENT of board order
    // Expected order:  middleDodo > backDodo > frontDodo
    // Order can be confirmed by Dodo attack scaling to give more or less based on activation order

    expect(petToString(steps[1].summary.playerTeam[0]!)).toBe("Sloth (13/1)");
    expect(petToString(steps[1].summary.playerTeam[1]!)).toBe("Dodo (13/1)");
    expect(petToString(steps[1].summary.playerTeam[2]!)).toBe("Dodo (20/1)");
    expect(petToString(steps[1].summary.playerTeam[3]!)).toBe("Dodo (8/1)");
  });

  it("Start of Battle dynamically updates based on attack order", () => {
    const frontDodo = pet({ type: "Dodo",  attack: 8, level: 2 });
    const middleDodo = pet({ type: "Dodo",  attack: 4, level: 2 });
    const backDodo = pet({ type: "Dodo",  attack: 12, level: 2 });

    const { steps } = simulateBattle(
      [pet({ attack: 0 }), frontDodo, middleDodo, backDodo],
      [pet({ attack: 0 })],
      PET_REGISTRY
    );

    // Initial expected trigger order:
    // -> backDodo (12 attack)
    // -> frontDodo (8 attack)
    // -> middleDodo (4 attack)

    // However, it should be updated after the backDodo fires to:
    // Updated expected trigger order:
    // -> middleDodo (16 attack)
    // -> frontDodo (8 attack)

    expect(petToString(steps[1].summary.playerTeam[0]!)).toBe("Sloth (24/1)");
    expect(petToString(steps[1].summary.playerTeam[1]!)).toBe("Dodo (24/1)");
    expect(petToString(steps[1].summary.playerTeam[2]!)).toBe("Dodo (16/1)");
    expect(petToString(steps[1].summary.playerTeam[3]!)).toBe("Dodo (12/1)");
  });

  it("Faint ability fires even when pet dies during the Start of Battle phase", () => {
    const { steps } = simulateBattle(
      [pet({ health: 5 }), pet({ type: "Badger",  attack: 6 })],
      [pet({ type: "Dolphin" })],
      PET_REGISTRY
    );
    // Dolphin's start-of-battle hit (4 dmg) kills the low-health Badger
    // before combat begins. Badger's faint ability must still fire, dealing
    // 3 dmg (50% of 6) to the Sloth ahead of it: 5 - 3 = 2.
    expect(steps[1].summary.description).toContain("Sloth (1/2)");
  });

  describe("Pending faints", () => {
    it("fires Start of Battle after its pet faints", () => {
      const { steps } = simulateBattle(
        [pet({ type: "Dolphin",  attack: 4, health: 3 })],
        [pet({ type: "Mosquito",  attack: 2, health: 2 }), pet({ health: 50 })],
        PET_REGISTRY
      );

      expect(petToString(steps[1].summary.playerTeam[0]!)).toBe("Dolphin (4/1)");
    });

    it("fires Friend ahead attacks after an After attack faints its pet", () => {
      const fired: number[] = [];
      const listener = abilityPet("Listener", {
        trigger: Trigger.friend_ahead_attacks,
        fn: (ctx) => fired.push(ctx.self.health),
      });

      simulateBattle(
        [pet({ type: "Elephant" }), pet({ type: "Listener" })],
        [pet()],
        registryWith(listener)
      );

      expect(fired[0]).toBe(0);
    });

    it("fires Friend ahead attacks when the attacking friend faints", () => {
      let fired = 0;
      const listener = abilityPet("Listener", {
        trigger: Trigger.friend_ahead_attacks,
        fn: () => fired++,
      });

      simulateBattle(
        [pet(), pet({ type: "Listener" })],
        [pet()],
        registryWith(listener)
      );

      expect(fired).toBe(1);
    });

    it("fires Knock out for successful knock out while fainting", () => {
      const { steps } = simulateBattle(
        [pet({ type: "Rhino" })],
        [pet(), pet({ health: 50 })],
        PET_REGISTRY
      );

      expect(steps[1].summary.playerTeam).toHaveLength(0);
      expect(steps[1].summary.opposingTeam[0]?.health).toBe(42);
    });
  });

  // TODO - Implement skipping friends that already have the perk
  it.skip("skips giving Melon to friends with Melon", () => {
    const turtle = pet({ type: "Turtle",  health: 0 });
    const melonFriend = pet({ perk: MelonPerk });
    const plainFriend = pet();
    const ability = PET_REGISTRY.Turtle.ability;
    if (ability?.trigger !== Trigger.faint) throw new Error("Expected faint ability");

    ability.fn(battleContext(turtle, [turtle, melonFriend, plainFriend], []));

    expect(plainFriend.perk?.name).toBe("Melon");
  });

  describe("Hurt trigger", () => {
    it("fires from ability damage", () => {
      const healthWhenHurt: number[] = [];
      const listener = abilityPet("Hurt Listener", {
        trigger: Trigger.hurt,
        fn: (ctx) => healthWhenHurt.push(ctx.self.health),
      });

      simulateBattle(
        [pet({ type: "Mosquito" })],
        [pet({ type: "Hurt Listener",  health: 10 })],
        registryWith(listener)
      );

      expect(healthWhenHurt[0]).toBe(9);
    });
  });

  describe("Friend ahead faints trigger", () => {
    it("fires after the fainted pet's Faint ability", () => {
      const order: string[] = [];
      const fainter = abilityPet("Fainter", { trigger: Trigger.faint, fn: () => order.push("Faint") });
      const listener = abilityPet("Listener", {
        trigger: Trigger.friend_ahead_faints,
        fn: () => order.push("Friend ahead faints"),
      });

      simulateBattle(
        [pet({ type: "Fainter" }), pet({ type: "Listener" })],
        [pet()],
        registryWith(fainter, listener)
      );

      expect(order).toEqual(["Faint", "Friend ahead faints"]);
    });

    it("fires before the fainted pet is removed", () => {
      const aheadTypes: string[] = [];
      const listener = abilityPet("Listener", {
        trigger: Trigger.friend_ahead_faints,
        fn: (ctx) => aheadTypes.push(ctx.team[ctx.selfIndex - 1].type),
      });

      simulateBattle(
        [pet({ type: "Ant" }), pet({ type: "Listener" })],
        [pet()],
        registryWith(listener)
      );

      expect(aheadTypes).toEqual(["Ant"]);
    });
  });

  describe("Friend ahead attacks trigger", () => {
    it("fires with priority for higher attack pets", () => {
      const order: string[] = [];
      const listener = (name: string) =>
        abilityPet(name, {
          trigger: Trigger.friend_ahead_attacks,
          fn: (ctx) => order.push(ctx.self.type),
        });
      const registry = registryWith(listener("Low"), listener("High"));

      simulateBattle(
        [pet(), pet({ type: "Low" })],
        [pet(), pet({ type: "High", attack: 9 })],
        registry
      );

      expect(order.slice(0, 2)).toEqual(["High", "Low"]);
    });

    it("resolves after After attack and before Hurt", () => {
      const order: string[] = [];
      const listener = (
        name: string,
        trigger: Trigger.after_attack | Trigger.friend_ahead_attacks | Trigger.hurt
      ) => abilityPet(name, { trigger, fn: () => order.push(name) });
      const registry = registryWith(
        listener("After", Trigger.after_attack),
        listener("Ahead", Trigger.friend_ahead_attacks),
        listener("Hurt", Trigger.hurt)
      );

      simulateBattle(
        [pet({ type: "After" }), pet({ type: "Ahead" })],
        [pet({ type: "Hurt" })],
        registry
      );

      expect(order.slice(0, 3)).toEqual(["After", "Ahead", "Hurt"]);
    });
  });
});

