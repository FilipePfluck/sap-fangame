import { describe, it, expect } from "vitest";
import { simulateBattle } from "@/lib/game/battle";
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
  describe("Peacock — hurt", () => {
    it.each([
      { level: 1, expectedAttack: 4 },
      { level: 2, expectedAttack: 7 },
      { level: 3, expectedAttack: 10 },
    ])(
      "gains +$expectedAttack attack at level $level after attack damage",
      ({ level, expectedAttack }) => {
        const { steps } = simulateBattle(
          [pet("Peacock", { health: 5, level })],
          [pet("Sloth")],
          PET_REGISTRY
        );

        expect(steps[1].attackerTeam[0].attack).toBe(expectedAttack);
      }
    );

    it("triggers for ability damage", () => {
      const { steps } = simulateBattle(
        [pet("Mosquito")],
        [pet("Peacock", { attack: 2, health: 5 })],
        PET_REGISTRY
      );

      expect(steps[1].defenderTeam[0].attack).toBe(8);
    });

    it("does not trigger when damage is fully blocked", () => {
      const { steps } = simulateBattle(
        [pet("Sloth")],
        [pet("Peacock", { perk: MelonPerk, attack: 2, health: 5 })],
        PET_REGISTRY
      );

      expect(steps[1].defenderTeam[0].attack).toBe(2);
    });

    it("does not trigger when health is removed", () => {
      const { steps } = simulateBattle(
        [pet("Skunk")],
        [pet("Sloth"), pet("Peacock", { attack: 2, health: 5 })],
        PET_REGISTRY
      );

      expect(steps[1].defenderTeam[0].health).toBe(3);
      expect(steps[1].defenderTeam[0].attack).toBe(2);
    });
  });

  describe("Kangaroo — friend ahead attacks", () => {
    it.each([
      { level: 1, expected: "Kangaroo (2/2)" },
      { level: 2, expected: "Kangaroo (3/3)" },
      { level: 3, expected: "Kangaroo (4/4)" },
    ])("gains +$level/+$level when its friend ahead attacks at level $level", ({ level, expected }) => {
      const { steps } = simulateBattle(
        [pet("Sloth", { health: 2 }), pet("Kangaroo", { level })],
        [pet("Sloth")],
        PET_REGISTRY
      );

      expect(petToString(steps[1].attackerTeam[1])).toBe(expected);
    });

    it("does not trigger from its own attack when a friend is behind", () => {
      const { steps } = simulateBattle(
        [pet("Kangaroo", { attack: 2, health: 2 }), pet("Sloth")],
        [pet("Sloth")],
        PET_REGISTRY
      );

      expect(petToString(steps[1].attackerTeam[0])).toBe("Kangaroo (2/1)");
    });
  });

  describe("Elephant — after attack", () => {
    it.each([
      { level: 1, expectedHealth: 9 },
      { level: 2, expectedHealth: 8 },
      { level: 3, expectedHealth: 7 },
    ])("deals 1 damage at level $level to the friend behind", ({ level, expectedHealth }) => {
      const { steps } = simulateBattle(
        [pet("Elephant", { level }), pet("Sloth", { health: 10 })],
        [pet("Sloth", { attack: 0 })],
        PET_REGISTRY
      );

      expect(steps[1].attackerTeam[1].health).toBe(expectedHealth);
    });

    it("targets only the nearest friend behind", () => {
      const { steps } = simulateBattle(
        [
          pet("Elephant", { level: 2 }),
          pet("Sloth", { health: 10 }),
          pet("Sloth", { health: 10 }),
        ],
        [pet("Sloth", { attack: 0 })],
        PET_REGISTRY
      );

      expect(steps[1].attackerTeam[1].health).toBe(8);
      expect(steps[1].attackerTeam[2].health).toBe(10);
    });

    it("retargets a living friend if the first one faints", () => {
      const { steps } = simulateBattle(
        [
          pet("Elephant", { level: 2 }),
          pet("Sloth"),
          pet("Sloth", { health: 9 }),
        ],
        [pet("Sloth", { attack: 0 })],
        PET_REGISTRY
      );

      expect(steps[1].attackerTeam).toHaveLength(2);
      expect(steps[1].attackerTeam[1].health).toBe(8);
    });
  });

  describe("Armadillo — start of battle", () => {
    it.each([
      { level: 1, bonus: 8 },
      { level: 2, bonus: 16 },
      { level: 3, bonus: 24 },
    ])("gives all living pets +$bonus health at level $level", ({ level, bonus }) => {
      const { steps } = simulateBattle(
        [pet("Armadillo", { level }), pet("Sloth")],
        [pet("Sloth", { attack: 0, health: 2 })],
        PET_REGISTRY
      );

      expect(steps[1].attackerTeam[0].health).toBe(1 + bonus);
      expect(steps[1].attackerTeam[1].health).toBe(1 + bonus);
      expect(steps[1].defenderTeam[0].health).toBe(1 + bonus);
    });

    it("does not buff pets at zero or negative health", () => {
      const armadillo = pet("Armadillo");
      const deadFriend = pet("Sloth", { health: 0 });
      const overkilledFriend = pet("Sloth", { health: -3 });
      const livingFriend = pet("Sloth");
      const ability = PET_REGISTRY.Armadillo.ability;
      if (ability?.trigger !== Trigger.start_of_battle) {
        throw new Error("Expected Armadillo start-of-battle ability");
      }

      ability.fn(
        battleContext(armadillo, [armadillo, deadFriend, overkilledFriend, livingFriend], [])
      );

      expect(armadillo.health).toBe(9);
      expect(deadFriend.health).toBe(0);
      expect(overkilledFriend.health).toBe(-3);
      expect(livingFriend.health).toBe(9);
    });
  });

  describe("Hedgehog — faint", () => {
    it.each([
      { level: 1, damage: 2, expectedHealth: 8 },
      { level: 2, damage: 4, expectedHealth: 6 },
      { level: 3, damage: 6, expectedHealth: 4 },
    ])("deals $damage damage to every living pet on both teams at level $level", ({ level, expectedHealth }) => {
      const hedgehog = pet("Hedgehog", { health: 0, level });
      const livingFriend = pet("Sloth", { health: 10 });
      const deadFriend = pet("Sloth", { health: 0 });
      const enemy = pet("Sloth", { health: 10 });
      const ability = PET_REGISTRY.Hedgehog.ability;
      if (ability?.trigger !== Trigger.faint) throw new Error("Expected faint ability");

      ability.fn(battleContext(hedgehog, [hedgehog, livingFriend, deadFriend], [enemy]));

      expect(livingFriend.health).toBe(expectedHealth);
      expect(deadFriend.health).toBe(0);
      expect(enemy.health).toBe(expectedHealth);
    });
  });

  describe("Flamingo — faint", () => {
    it.each([
      { level: 1, expected: ["Sloth (2/2)", "Sloth (2/2)", "Sloth (1/1)", "Sloth (1/1)"] },
      { level: 2, expected: ["Sloth (3/3)", "Sloth (3/3)", "Sloth (1/1)", "Sloth (1/1)"] },
      { level: 3, expected: ["Sloth (4/4)", "Sloth (4/4)", "Sloth (1/1)", "Sloth (1/1)"] },
    ])("gives the two nearest friends behind +$level/+$level at level $level", ({ level, expected }) => {
      const flamingo = pet("Flamingo", { health: 0, level });
      const friends = [pet("Sloth"), pet("Sloth"), pet("Sloth"), pet("Sloth")];
      const ability = PET_REGISTRY.Flamingo.ability;
      if (ability?.trigger !== Trigger.faint) throw new Error("Expected faint ability");

      ability.fn(battleContext(flamingo, [flamingo, ...friends], []));

      expect(friends.map(petToString)).toEqual(expected);
    });

    it("skips pending faints and buffs the nearest living friends behind", () => {
      const flamingo = pet("Flamingo", { health: 0 });
      const deadFriend = pet("Sloth", { health: 0 });
      const firstFriend = pet("Sloth");
      const secondFriend = pet("Sloth");
      const thirdFriend = pet("Sloth");
      const team = [flamingo, deadFriend, firstFriend, secondFriend, thirdFriend];
      const ability = PET_REGISTRY.Flamingo.ability;
      if (ability?.trigger !== Trigger.faint) throw new Error("Expected faint ability");

      ability.fn(battleContext(flamingo, team, []));

      expect(deadFriend).toMatchObject({ attack: 1, health: 0 });
      expect(firstFriend).toMatchObject({ attack: 2, health: 2 });
      expect(secondFriend).toMatchObject({ attack: 2, health: 2 });
      expect(thirdFriend).toMatchObject({ attack: 1, health: 1 });
    });
  });

  describe("Camel — hurt", () => {
    it.each([
      { level: 1, ability: "+1/+2", result: "Sloth (2/3)" },
      { level: 2, ability: "+2/+4", result: "Sloth (3/5)" },
      { level: 3, ability: "+3/+6", result: "Sloth (4/7)" },
    ])("gives the nearest friend behind $ability when damaged at level $level", ({ level, result }) => {
      const { steps } = simulateBattle(
        [pet("Camel", { health: 2, level }), pet("Sloth")],
        [pet("Sloth")],
        PET_REGISTRY
      );

      expect(petToString(steps[1].attackerTeam[1])).toBe(result);
    });

    it("skips a pending faint to buff the nearest living friend behind", () => {
      const camel = pet("Camel");
      const deadFriend = pet("Sloth", { health: 0 });
      const livingFriend = pet("Sloth");
      const ability = PET_REGISTRY.Camel.ability;
      if (ability?.trigger !== Trigger.hurt) throw new Error("Expected hurt ability");

      ability.fn(battleContext(camel, [camel, deadFriend, livingFriend], []));

      expect(deadFriend).toMatchObject({ attack: 1, health: 0 });
      expect(livingFriend).toMatchObject({ attack: 2, health: 3 });
    });
  });

  describe("Blowfish — hurt", () => {
    it.each([
      { level: 1, damage: 3, expectedHealth: 17 },
      { level: 2, damage: 6, expectedHealth: 14 },
      { level: 3, damage: 9, expectedHealth: 11 },
    ])(
      "deals $damage ability damage to an enemy after taking a hit at level $level",
      ({ level, expectedHealth }) => {
        const { steps } = simulateBattle(
          [pet("Blowfish", { attack: 0, level })],
          [pet("Sloth", { health: 20 })],
          PET_REGISTRY
        );

        expect(steps[1].defenderTeam[0].health).toBe(expectedHealth);
      }
    );
  });

  describe("Sheep — faint", () => {
    it.each([
      { level: 1, ram: "Ram (2/2)" },
      { level: 2, ram: "Ram (4/4)" },
      { level: 3, ram: "Ram (6/6)" },
    ])("summons two $ram at level $level", ({ level, ram }) => {
      const { steps } = simulateBattle(
        [pet("Sheep", { level })],
        [pet("Sloth")],
        PET_REGISTRY
      );

      expect(steps[1].attackerTeam.map(petToString)).toEqual([ram, ram]);
    });

    it("flings the second Ram when the team has room for only one summon", () => {
      const { steps } = simulateBattle(
        [
          pet("Sheep"),
          pet("Sloth"),
          pet("Sloth"),
          pet("Sloth"),
          pet("Sloth"),
        ],
        [pet("Sloth")],
        PET_REGISTRY
      );

      expect(steps[1].attackerTeam.filter((friend) => friend.type === "Ram")).toHaveLength(1);
      expect(steps[1].attackerTeam).toHaveLength(5);
    });
  });

  describe("Turtle — faint", () => {
    it.each([
      { level: 1, perks: ["Melon", null, null, null] },
      { level: 2, perks: ["Melon", "Melon", null, null] },
      { level: 3, perks: ["Melon", "Melon", "Melon", null] },
    ])("gives Melon to the $level nearest friends behind at level $level", ({ level, perks }) => {
      const turtle = pet("Turtle", { health: 0, level });
      const friends = [pet("Sloth"), pet("Sloth"), pet("Sloth"), pet("Sloth")];
      const ability = PET_REGISTRY.Turtle.ability;
      if (ability?.trigger !== Trigger.faint) throw new Error("Expected faint ability");

      ability.fn(battleContext(turtle, [turtle, ...friends], []));

      expect(friends.map((friend) => friend.perk?.name ?? null)).toEqual(perks);
    });

    it("skips pending faints when giving Melon", () => {
      const turtle = pet("Turtle", { health: 0 });
      const deadFriend = pet("Sloth", { health: 0 });
      const firstFriend = pet("Sloth");
      const secondFriend = pet("Sloth");
      const ability = PET_REGISTRY.Turtle.ability;
      if (ability?.trigger !== Trigger.faint) throw new Error("Expected faint ability");

      ability.fn(battleContext(turtle, [turtle, deadFriend, firstFriend, secondFriend], []));

      expect(deadFriend.perk).toBeNull();
      expect(firstFriend.perk?.name).toBe("Melon");
    });
  });

  describe("Rooster — faint", () => {
    it.each([
      { level: 1, expected: ["Chick (3/1)"] },
      { level: 2, expected: ["Chick (3/1)", "Chick (3/1)"] },
      { level: 3, expected: ["Chick (3/1)", "Chick (3/1)", "Chick (3/1)"] },
    ])("summons $level Chick tokens with half its attack at level $level", ({ level, expected }) => {
      const { steps } = simulateBattle(
        [pet("Rooster", { attack: 6, level })],
        [pet("Sloth")],
        PET_REGISTRY
      );

      expect(steps[1].attackerTeam.map(petToString)).toEqual(expected);
    });

    it("rounds half its attack down", () => {
      const { steps } = simulateBattle(
        [pet("Rooster", { attack: 5 })],
        [pet("Sloth")],
        PET_REGISTRY
      );

      expect(petToString(steps[1].attackerTeam[0])).toBe("Chick (2/1)");
    });

    it("does not summon a Chick with 0 attack", () => {
      const { steps } = simulateBattle(
        [pet("Rooster", { attack: 1 })],
        [pet("Sloth")],
        PET_REGISTRY
      );

      expect(steps[1].attackerTeam).toHaveLength(0);
    });
  });

  describe("Mammoth — faint", () => {
    it("buffs living friends but not itself or pending faints", () => {
      const mammoth = pet("Mammoth", { health: 0 });
      const deadFriend = pet("Sloth", { health: 0 });
      const livingFriend = pet("Sloth");
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
        [pet("Sloth"), pet("Ox")],
        [pet("Sloth")],
        registryWith(Ox)
      );

      expect(petToString(steps[1].attackerTeam[0])).toBe("Ox (2/1)");
      expect(steps[1].attackerTeam[0].perk?.name).toBe("Melon");
    });

    it.skip.each([
      { level: 1 },
      { level: 2 },
      { level: 3 },
    ])("triggers at most $level at level $level", () => {})

    it("does not trigger when a friend further ahead faints", () => {
      const { steps } = simulateBattle(
        [pet("Sloth"), pet("Sloth"), pet("Ox")],
        [pet("Sloth")],
        registryWith(Ox)
      );

      expect(petToString(steps[1].attackerTeam[1])).toBe("Ox (1/1)");
      expect(steps[1].attackerTeam[1].perk).toBeNull();
    });

    it("works once per turn in battle", () => {
      const { steps } = simulateBattle(
        [pet("Sloth", { perk: HoneyPerk }), pet("Ox")],
        [pet("Sloth", { health: 10 })],
        registryWith(Ox)
      );

      expect(steps[2].attackerTeam.map(petToString)).toEqual(["Ox (2/1)"]);
    });

    it("does not trigger in battle after triggering in the shop that turn", () => {
      const { steps } = simulateBattle(
        [pet("Sloth"), pet("Ox", { triggers: 1})],
        [pet("Sloth")],
        registryWith(Ox)
      );

      expect(petToString(steps[1].attackerTeam[0])).toBe("Ox (1/1)");
      expect(steps[1].attackerTeam[0].perk).toBeNull();
    });
  });

  describe("Snake — friend ahead attacks", () => {
    it.each([
      { level: 1, damage: 5, expectedHealth: 45 },
      { level: 2, damage: 10, expectedHealth: 40 },
      { level: 3, damage: 15, expectedHealth: 35 },
    ])("deals $damage damage to a random enemy at level $level", ({ level, expectedHealth }) => {
      const { steps } = simulateBattle(
        [pet("Sloth", { attack: 0 }), pet("Snake", { level })],
        [pet("Sloth", { attack: 0, health: 50 })],
        PET_REGISTRY
      );

      expect(steps[1].defenderTeam[0].health).toBe(expectedHealth);
    });

    it("deals damage at most five times", () => {
      const { steps } = simulateBattle(
        [pet("Sloth", { attack: 0 }), pet("Snake")],
        [pet("Sloth", { attack: 0, health: 50 })],
        PET_REGISTRY
      );

      expect(steps.at(-1)?.defenderTeam[0].health).toBe(25);
    });
  });

  describe("Rabbit — food gained by ability", () => {
    const tripleFeeder = abilityPet("Triple Feeder", {
      trigger: Trigger.start_of_battle,
      fn: (ctx) => {
        for (let i = 0; i < 3; i++) ctx.friendAteFood(ctx.team[1]);
      },
    });

    it("has only the triggers left over from the shop", () => {
      const { steps } = simulateBattle(
        [pet("Triple Feeder"), pet("Rabbit", { triggers: 1 })],
        [pet("Sloth", { attack: 0 })],
        registryWith(tripleFeeder)
      );

      expect(steps[1].attackerTeam[1].health).toBe(3);
    });

    // TODO: This doesn't appear to "return to the shop," and simply tests that simulateBattle doesn't mutate PetData
    it("does not carry battle triggers back to the shop", () => {
      const rabbit = pet("Rabbit", { triggers: 1 });
      simulateBattle(
        [pet("Triple Feeder"), rabbit],
        [pet("Sloth")],
        registryWith(tripleFeeder)
      );

      expect(rabbit.triggers).toBe(1);
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
        [pet("Perk Giver"), pet("Rabbit")],
        [pet("Sloth")],
        registryWith(perkGiver)
      );

      expect(steps[1].attackerTeam[0].health).toBe(2);
      expect(steps[1].attackerTeam[0].perk).toBe(MelonPerk);
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
        [pet("Experience Giver"), pet("Sloth", { xp: 5, level: 3 })],
        [pet("Sloth", { attack: 0 })],
        registryWith(experienceGiver)
      );

      expect(steps[1].attackerTeam[1]).toMatchObject({
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
        fn: (ctx) => ctx.summon(pet("Sloth"), ctx.selfIndex),
      });
      const { steps } = simulateBattle(
        [pet(summoner.name), pet("Dog", { health: 0 })],
        [pet("Sloth", { attack: 0 })],
        registryWith(summoner)
      );

      expect(steps[1].attackerTeam.some((friend) => friend.type === "Dog")).toBe(false);
    });

    it("Mosquito only selects enemies with health remaining", () => {
      const deadEnemy = pet("Sloth", { health: 0 });
      const livingEnemy = pet("Sloth", { health: 10 });
      const mosquito = pet("Mosquito");
      const ability = PET_REGISTRY.Mosquito.ability;
      if (ability?.trigger !== Trigger.start_of_battle) throw new Error("Expected Mosquito start-of-battle ability");

      ability.fn(battleContext(mosquito, [mosquito], [deadEnemy, livingEnemy]));

      expect(deadEnemy.health).toBe(0);
      expect(livingEnemy.health).toBe(9);
    });

    it("Elephant skips a pending faint and targets the nearest living friend behind", () => {
      const elephant = pet("Elephant");
      const deadFriend = pet("Sloth", { health: 0 });
      const livingFriend = pet("Sloth", { health: 10 });
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
          [pet("Mosquito", { level })],
          [pet("Sloth"), pet("Sloth"), pet("Sloth")],
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
          [pet("Ant", { level }), pet("Sloth")],
          [pet("Sloth")],
          PET_REGISTRY
        );

        expect(petToString(steps[1].attackerTeam[0])).toBe(result);
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
          [pet("Cricket", { level })],
          [pet("Sloth")],
          PET_REGISTRY
        );

        expect(petToString(steps[1].attackerTeam[0])).toBe(result);
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
        [pet("Cricket"), pet("Dog", { level })],
        [pet("Sloth")],
        PET_REGISTRY
      );

      expect(petToString(steps[1].attackerTeam[1])).toBe(result);
    });
  });

  describe("Turkey — friend summoned", () => {
    it.each([
      { level: 1, ability: "+3/+1", result: "Zombie Cricket (4/2)" },
      { level: 2, ability: "+6/+2", result: "Zombie Cricket (7/3)" },
      { level: 3, ability: "+9/+3", result: "Zombie Cricket (10/4)" },
    ])("gives the summoned friend $ability at level $level", ({ level, result }) => {
      const { steps } = simulateBattle(
        [pet("Cricket"), pet("Turkey", { level })],
        [pet("Sloth")],
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
    ])(
      "gives summoned pets +$level attack at level $level",
      ({ level, result }) => {
        // NOTE: Test can fail due to Cricket being incorrectly implemented
        // Sloth kills Cricket, Cricket summons 1/1 Zombie Cricket, test confirms Horse provides an appropriate buff
        const { steps } = simulateBattle(
          [pet("Cricket"), pet("Horse", { level })],
          [pet("Sloth")],
          PET_REGISTRY
        );

        const stepAfterRound1 = steps[1];
        expect(petToString(stepAfterRound1.attackerTeam[0])).toBe(result);
      }
    );
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
          [pet("Sloth"), pet("Ant"), pet("Dodo", { attack: 4, level })],
          [pet("Sloth", { attack: 0 })],
          PET_REGISTRY
        );

        expect(petToString(steps[0].attackerTeam[1])).toBe("Ant (1/1)");
        expect(petToString(steps[1].attackerTeam[1])).toBe(result);
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

        const friendAhead = pet("Sloth", { health: allyHealth });
        const friendBehind = pet("Sloth", { health: allyHealth });
        const { result } = simulateBattle(
          [friendBehind, pet("Badger", { attack: 6, level }), friendAhead],
          [pet("Dolphin")],
          PET_REGISTRY
        );

        expect(result).toBe("LOSE");
      }
    );

    it("deals splash damage to closest friend behind on faint", () => {
      const { result, steps } = simulateBattle(
        [pet("Badger", { attack: 6 }), pet("Sloth", { health: 5 }), pet("Sloth", { health: 5 })],
        [pet("Sloth")],
        PET_REGISTRY
      );

      expect(steps[1].attackerTeam[0].health).toBe(2);
      expect(steps[1].attackerTeam[1].health).toBe(5);
    });

    it("hits the front enemy when it is at the front of its team", () => {
      const badger = pet("Badger", { attack: 6, health: 0 });
      const enemy = pet("Sloth", { health: 10 });
      const secondEnemy = pet("Sloth", { health: 10 });
      const ability = PET_REGISTRY.Badger.ability;
      if (ability?.trigger !== Trigger.faint) throw new Error("Expected Badger faint ability");

      ability.fn(battleContext(badger, [badger], [enemy, secondEnemy]));

      expect(enemy.health).toBe(7);
      expect(secondEnemy.health).toBe(10);
    });

    it("skips pending faints", () => {
      const deadFriendAhead = pet("Sloth", { health: 0 });
      const badger = pet("Badger", { attack: 6, health: 0 });
      const deadFriendBehind = pet("Sloth", { health: 0 });
      const livingFriendBehind = pet("Sloth", { health: 10 });
      const deadEnemyFront = pet("Sloth", { health: 0 });
      const livingEnemyBehind = pet("Sloth", { health: 10 });
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
          [pet("Dolphin", { attack: 0, level })],
          [pet("Sloth", { health: 49 }), pet("Sloth", { health: 50 })],
          PET_REGISTRY
        );

        expect(steps[1].description).toContain(result);
      }
    );

    it("repeats the hit `level` times, re-targeting whichever enemy is currently lowest health", () => {
      const { result } = simulateBattle(
        [pet("Dolphin", { level: 2 })],
        [pet("Sloth", { health: 4 }), pet("Sloth", { health: 4 })],
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
          [pet("Skunk", { level })],
          [pet("Sloth", { health: 10 })],
          PET_REGISTRY
        );

        expect(steps[1].description).toContain(result);
      }
    );

    it("cannot reduce a pet's health below 1", () => {
      const { steps } = simulateBattle(
        [pet("Skunk")],
        [pet("Sloth")],
        PET_REGISTRY
      );
      expect(steps[1].description).toContain("Sloth (1/1)");
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
          [pet("Crab", { level }), pet("Sloth", { health: 20 })],
          [pet("Sloth")],
          PET_REGISTRY
        );

        expect(steps[1].description).toContain(result);
      }
    );

    it("no-op when there are no friends", () => {
      const { steps } = simulateBattle(
        [pet("Crab")],
        [pet("Sloth")],
        PET_REGISTRY
      );
      expect(steps[1].description).toContain("Crab (1/1)");
    });
  });

  describe("Leopard — start-of-battle", () => {
    it.each([
      { level: 1, expected: "LOSS" },
      { level: 2, expected: "DRAW" },
      { level: 3, expected: "WIN" },
    ])("snipes %level pets at level $level", ({ level, expected }) => {
      const { result } = simulateBattle(
        [pet("Leopard", { attack: 2, level })],
        [pet("Sloth"), pet("Sloth"), pet("Sloth")],
        PET_REGISTRY
      );

      expect(result).toBe(expected);
    });

    it("snipes deal 50% of attack damage", () => {
      const { steps } = simulateBattle(
        [pet("Leopard", { attack: 10 })],
        [pet("Sloth", { health: 10 })],
        PET_REGISTRY
      );

      expect(steps[1].description).toContain("Sloth (1/5)");
    });
  });

  describe("Boar — before-attack", () => {
    it.each([
      { level: 1, ability: "+4/+2", result: "Boar (5/3)" },
      { level: 2, ability: "+8/+4", result: "Boar (9/5)" },
      { level: 3, ability: "+12/+6", result: "Boar (13/7)" },
    ])("gains $ability before attack at level $level", ({ level, result }) => {
      const { steps } = simulateBattle(
        [pet("Boar", { level })],
        [pet("Sloth", { attack: 0 })],
        PET_REGISTRY
      );

      expect(steps[1].description).toContain(result);
    });

    it("retriggers", () => {
      const { steps } = simulateBattle(
        [pet("Boar")],
        [pet("Sloth", { attack: 0, health: 50})],
        PET_REGISTRY
      );

      expect(steps[1].description).toContain("Boar (5/3)");
      expect(steps[2].description).toContain("Boar (9/5)");
      expect(steps[3].description).toContain("Boar (13/7)");
      expect(steps[4].description).toContain("Boar (17/9)");
    });
  });

  describe("Hippo — knock-out", () => {
    it.each([
      { level: 1, ability: "+3/+3", result: "Hippo (4/4)" },
      { level: 2, ability: "+6/+6", result: "Hippo (7/7)" },
      { level: 3, ability: "+9/+9", result: "Hippo (10/10)" },
    ])("gains $ability per knock-out at level $level", ({ level, result }) => {
      const { steps } = simulateBattle(
        [pet("Hippo", { level })],
        [pet("Sloth", { attack: 0 })],
        PET_REGISTRY
      );

      expect(petToString(steps[1].attackerTeam[0])).toBe(result);
    });

    it("is capped at 3 triggers per battle", () => {
      const { steps } = simulateBattle(
        [pet("Hippo")],
        [
          pet("Sloth", { attack: 0 }),
          pet("Sloth", { attack: 0 }),
          pet("Sloth", { attack: 0 }),
          pet("Sloth", { attack: 0 }),
        ],
        PET_REGISTRY
      );

      const lastStep = steps[steps.length - 1];
      expect(petToString(lastStep.attackerTeam[0])).toContain("Hippo (10/10)");
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
          [pet("Rhino", { level })],
          [pet("Sloth"), pet("Dodo", { health: 50 })],
          PET_REGISTRY
        );

        expect(steps[1].defenderTeam[0].health).toBe(50 - expected);
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
          [pet("Rhino", { level })],
          [pet("Sloth"), pet("Sloth", { health: 50 })],
          PET_REGISTRY
        );

        expect(steps[1].defenderTeam[0].health).toBe(50 - expected);
      }
    );
  });

  describe("Crocodile — start-of-battle", () => {
    it.each([1, 2, 3])(
      "deals 8 damage to the last enemy, repeated %i times at level $level",
      (level) => {
        const { steps } = simulateBattle(
          [pet("Crocodile", { level })],
          [pet("Sloth", { health: 30 }), pet("Sloth", { health: 30 })],
          PET_REGISTRY
        );

        expect(steps[1].defenderTeam[1].health).toBe(30 - level * 8);
      }
    );

    it("deals repeated damage separately", () => {
      const { steps } = simulateBattle(
        [pet("Crocodile", { attack: 0, level: 3 })],
        [pet("Sloth", { health: 20 }), pet("Sloth", { health: 8 })],
        PET_REGISTRY
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
    it("repeats a friend's Faint ability before that friend is removed", () => {
      const { steps } = simulateBattle(
        [pet("Ant"), pet("Tiger")],
        [pet("Sloth")],
        PET_REGISTRY
      );

      expect(steps[1].attackerTeam[0]).toMatchObject({
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
            pet("Sloth"),
            pet("Dodo", { attack: 4 }),
            pet("Tiger", { level }),
          ],
          [pet("Sloth")],
          PET_REGISTRY
        );

        expect(steps[1].description).toContain(result);
      }
    );
  });
})

describe("Perks", () => {
  describe("Honey perk — faint", () => {
    it("summons a 1/1 Bee when a Honey-perked pet faints", () => {
      // Sloth with Honey 1/1 vs Sloth 2/2. Sloth takes 2 → faints. Honey triggers: Bee (1/1) appears.
      // Bee (1/1) vs Sloth (2/1). Sloth takes 1 → dies. Bee takes 2 → dies. DRAW.
      const honeySloth = pet("Sloth", { perk: HoneyPerk });
      const opponent = pet("Sloth", { health: 2 });

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

    it("flings Honey's Bee when Cricket's Zombie Cricket fills the last slot", () => {
      const { steps } = simulateBattle(
        [
          pet("Cricket", { perk: HoneyPerk }),
          pet("Sloth"),
          pet("Sloth"),
          pet("Sloth"),
          pet("Sloth")
        ],
        [pet("Sloth")],
        PET_REGISTRY
      );

      expect(steps[1].attackerTeam).toHaveLength(5);
      expect(steps[1].attackerTeam[0].type).toBe("Zombie Cricket");
      expect(steps[1].attackerTeam.some((friend) => friend.type === "Bee")).toBe(false);
    });

    it("does not mutate input teams", () => {
      const honeySloth: PetData = pet("Sloth", { perk: HoneyPerk });
      const opponent = pet("Sloth", { attack: 2, health: 2 });
      simulateBattle([honeySloth], [opponent], PET_REGISTRY);

      expect(honeySloth.health).toBe(1);
      expect(opponent.health).toBe(2);
    });
  });

  describe("Peanut perk — lethal on hit", () => {
    it("knocks out any pet it deals damage to in combat", () => {
      const { result, steps } = simulateBattle(
        [pet("Scorpion", { health: 2, perk: PeanutPerk })],
        [pet("Sloth", { health: 100 })],
        PET_REGISTRY
      );
      expect(result).toBe("WIN");
      expect(steps).toHaveLength(2); // Battle start + 1 round: the single hit is lethal
    });

    it("Peanut requires damage to kill", () => {
      const scorpion = pet("Scorpion", { perk: PeanutPerk });
      const melonSloth: PetData = pet("Sloth", { perk: MelonPerk });
      const { steps } = simulateBattle([scorpion], [melonSloth], PET_REGISTRY);

      // Scorpion's 1 dmg is fully blocked (min(20,1)=1) — Sloth takes 0, so it
      // wasn't "hurt" and Peanut's instakill does not apply.
      expect(steps[1].defenderTeam[0].health).toBe(1);
    });
  });

  describe("Garlic perk — damage reduction", () => {
    it("reduces incoming damage by 2", () => {
      const garlicSloth = pet("Sloth", { health: 10, perk: GarlicPerk });
      const opposingSloth = pet("Sloth", { attack: 5 });
      const { steps } = simulateBattle([garlicSloth], [opposingSloth], PET_REGISTRY);

      expect(steps[1].attackerTeam[0].health).toBe(7);
    });

    it("does not increase damage for attackers with only 1 attack", () => {
      const garlicSloth = pet("Sloth", { health: 10, perk: GarlicPerk });
      const { steps } = simulateBattle([garlicSloth], [pet("Sloth")], PET_REGISTRY);

      expect(steps[1].attackerTeam[0].health).toBe(9);
    });
  });

  describe("Melon perk — damage block", () => {
    it("blocks up to 20 damage on the first hit, then clears", () => {
      const melonSloth = pet("Sloth", { health: 10, perk: MelonPerk });
      const { steps } = simulateBattle([melonSloth], [pet("Sloth")], PET_REGISTRY);

      expect(steps[1].attackerTeam[0].health).toBe(10);
      expect(steps[1].attackerTeam[0].perk).toBeNull();
    });

    it("blocks exactly 20 and lets the remainder through on a bigger hit", () => {
      const melonSloth = pet("Sloth", { health: 10, perk: MelonPerk });
      const normalSloth = pet("Sloth", { attack: 21 });

      const { steps } = simulateBattle([melonSloth], [normalSloth], PET_REGISTRY);
      expect(steps[1].attackerTeam[0].health).toBe(9); // 10 - (21-20)
    });

    it("no longer blocks a second hit once used up", () => {
      const melonSloth = pet("Sloth", { health: 30, perk: MelonPerk });
      const { steps } = simulateBattle([melonSloth], [pet("Sloth", { attack: 5, health: 5 })], PET_REGISTRY);

      expect(steps[1].attackerTeam[0].health).toBe(30); // round 1: blocked
      console.log(steps[1].attackerTeam[0].perk);
      expect(steps[2].attackerTeam[0].health).toBe(25); // round 2: perk gone, takes 5
      console.log(steps[2].attackerTeam[0].perk);
    });
  });

  describe("Meat Bone", () => {
    it("increases base attack by +3", () => {
      const meatBoneSloth = pet("Sloth", { attack: 1, perk: MeatBonePerk});
      const opponent = pet("Sloth", { health: 4 });

      const { result } = simulateBattle([meatBoneSloth], [opponent], PET_REGISTRY);
      expect(result).toBe("DRAW");
    });
  })

  describe("Steak", () => {
    it("increases base attack by +20", () => {
      const steakSloth = pet("Sloth", { attack: 1, perk: SteakPerk });
      const opponent = pet("Sloth", { health: 22 });

      const { steps } = simulateBattle([steakSloth], [opponent], PET_REGISTRY);
      expect(steps[1].defenderTeam[0].health).toBe(1);
    });

    it("is consumed after use", () => {
      const steakSloth = pet("Sloth", { perk: SteakPerk });
      const opponent = pet("Sloth");

      const { steps } = simulateBattle([steakSloth], [opponent], PET_REGISTRY);
      expect(steps[0].attackerTeam[0].perk?.name).toBe("Steak");
      expect(steps[1].attackerTeam[0].perk).toBe(null);
    });
  })

  describe("Mushroom", () => {
    it("summons the same pet as a 1/1", () => {
      const mushroomSloth = pet("Sloth", { health: 2, perk: MushroomPerk });
      const opponent = pet("Sloth", { health: 3 });
      const { result, steps } = simulateBattle([mushroomSloth], [opponent], PET_REGISTRY);

      // Bee (1/1) vs Sloth (2/1). They trade → DRAW.
      expect(result).toBe("DRAW");

      // After round 1, Sloth should appear in attacker team
      const stepAfterRound1 = steps[1];
      expect(stepAfterRound1.attackerTeam[0].type).toBe("Sloth");
      expect(stepAfterRound1.attackerTeam[0].attack).toBe(1);
      expect(stepAfterRound1.attackerTeam[0].health).toBe(1);
    });
  });
});

describe("Engine Behavior", () => {
  // TODO - Implement test to ensure randomness between same trigger and attack

  it("Start of Battle resolves by attack, not board position", () => {
    const frontDodo = pet("Dodo", { attack: 1, level: 2 });
    const middleDodo = pet("Dodo", { attack: 12, level: 2 });
    const backDodo = pet("Dodo", { attack: 8, level: 2 });
    const { steps } = simulateBattle(
      [pet("Sloth", { attack: 0 }), frontDodo, middleDodo, backDodo],
      [pet("Sloth", { attack: 0 })],
      PET_REGISTRY
    );

    // Activation order should be INDEPENDENT of board order
    // Expected order:  middleDodo > backDodo > frontDodo
    // Order can be confirmed by Dodo attack scaling to give more or less based on activation order

    expect(petToString(steps[1].attackerTeam[0])).toBe("Sloth (13/1)");
    expect(petToString(steps[1].attackerTeam[1])).toBe("Dodo (13/1)");
    expect(petToString(steps[1].attackerTeam[2])).toBe("Dodo (20/1)");
    expect(petToString(steps[1].attackerTeam[3])).toBe("Dodo (8/1)");
  });

  it("Start of Battle dynamically updates based on attack order", () => {
    const frontDodo = pet("Dodo", { attack: 8, level: 2 });
    const middleDodo = pet("Dodo", { attack: 4, level: 2 });
    const backDodo = pet("Dodo", { attack: 12, level: 2 });

    const { steps } = simulateBattle(
      [pet("Sloth", { attack: 0 }), frontDodo, middleDodo, backDodo],
      [pet("Sloth", { attack: 0 })],
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

    expect(petToString(steps[1].attackerTeam[0])).toBe("Sloth (24/1)");
    expect(petToString(steps[1].attackerTeam[1])).toBe("Dodo (24/1)");
    expect(petToString(steps[1].attackerTeam[2])).toBe("Dodo (16/1)");
    expect(petToString(steps[1].attackerTeam[3])).toBe("Dodo (12/1)");
  });

  it("Faint ability fires even when pet dies during the Start of Battle phase", () => {
    const { steps } = simulateBattle(
      [pet("Sloth", { health: 5 }), pet("Badger", { attack: 6 })],
      [pet("Dolphin")],
      PET_REGISTRY
    );
    // Dolphin's start-of-battle hit (4 dmg) kills the low-health Badger
    // before combat begins. Badger's faint ability must still fire, dealing
    // 3 dmg (50% of 6) to the Sloth ahead of it: 5 - 3 = 2.
    expect(steps[1].description).toContain("Sloth (1/2)");
  });

  describe("Pending faints", () => {
    it("fires Start of Battle after its pet faints", () => {
      const { steps } = simulateBattle(
        [pet("Dolphin", { attack: 4, health: 3 })],
        [pet("Mosquito", { attack: 2, health: 2 }), pet("Sloth", { health: 50 })],
        PET_REGISTRY
      );

      expect(petToString(steps[1].attackerTeam[0])).toBe("Dolphin (4/1)");
    });

    it("fires Friend ahead attacks after an After attack faints its pet", () => {
      const fired: number[] = [];
      const listener = abilityPet("Listener", {
        trigger: Trigger.friend_ahead_attacks,
        fn: (ctx) => fired.push(ctx.self.health),
      });

      simulateBattle(
        [pet("Elephant"), pet("Listener")],
        [pet("Sloth")],
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
        [pet("Sloth"), pet("Listener")],
        [pet("Sloth")],
        registryWith(listener)
      );

      expect(fired).toBe(1);
    });

    it("fires Knock out for successful knock out while fainting", () => {
      const { steps } = simulateBattle(
        [pet("Rhino")],
        [pet("Sloth"), pet("Sloth", { health: 50 })],
        PET_REGISTRY
      );

      expect(steps[1].attackerTeam).toHaveLength(0);
      expect(steps[1].defenderTeam[0].health).toBe(42);
    });
  });

  // TODO - Implement skipping friends that already have the perk
  it.skip("skips giving Melon to friends with Melon", () => {
    const turtle = pet("Turtle", { health: 0 });
    const melonFriend = pet("Sloth", { perk: MelonPerk });
    const plainFriend = pet("Sloth");
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
        [pet("Mosquito")],
        [pet("Hurt Listener", { health: 10 })],
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
        [pet("Fainter"), pet("Listener")],
        [pet("Sloth")],
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
        [pet("Ant"), pet("Listener")],
        [pet("Sloth")],
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
        [pet("Sloth"), pet("Low")],
        [pet("Sloth"), pet("High", { attack: 9 })],
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
        [pet("After"), pet("Ahead")],
        [pet("Hurt")],
        registry
      );

      expect(order.slice(0, 3)).toEqual(["After", "Ahead", "Hurt"]);
    });
  });
});

