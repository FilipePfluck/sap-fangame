import { describe, it, expect } from "vitest";
import { simulateBattle } from "@/lib/game/battle";
import { PET_REGISTRY } from "@/lib/pets";
import { petToString } from "@/lib/utils/flavor-text";
import type { BattleAbilityContext, PetInstance } from "@/lib/types";
import { Trigger } from "@/lib/types";
import { grantExperience } from "@/lib/game/merge";
import { BattleActions } from "@/lib/game/ability-actions";
import {
  dealDirectDamage,
  removeHealth,
  removePercentageHealth,
} from "@/lib/utils/combat";
import { fireShopFriendSummoned } from "@/lib/game/shop-ability";
import { ChiliPerk } from "@/lib/perks/chili";
import { CoconutPerk } from "@/lib/perks/coconut";
import { GarlicPerk } from "@/lib/perks/garlic";
import { MelonPerk } from "@/lib/perks/melon";
import { PeanutPerk } from "@/lib/perks/peanut";
import { HoneyPerk } from "@/lib/perks/honey";
import { MeatBonePerk } from "@/lib/perks/meat-bone";
import { MushroomPerk } from "@/lib/perks/mushroom";
import { SteakPerk } from "@/lib/perks/steak";
import { Ox } from "@/lib/pets/turtle/tier 3/ox";
import { abilityPet, pet, registryWith } from "./helpers";
import { getMinimumXpFor } from "@/lib/game/board";

function battleContext(
  self: PetInstance,
  team: PetInstance[],
  enemyTeam: PetInstance[]
): BattleAbilityContext {
  return {
    self,
    selfIndex: team.indexOf(self),
    team,
    enemyTeam,
    level: self.level,
    summonRequests: [],
    hurtPets: [],
    petRegistry: PET_REGISTRY,
  };
}

describe("Pet Abilities", () => {
  describe("Peacock — hurt", () => {
    it.each([
      { level: 1, expectedAttack: 5 },
      { level: 2, expectedAttack: 8 },
      { level: 3, expectedAttack: 11 },
    ])(
      "gains +$expectedAttack attack at level $level after attack damage",
      ({ level, expectedAttack }) => {
        const { steps } = simulateBattle(
          [pet({ type: "Peacock", attack: 2, health: 5, level })],
          [pet({ type: "Sloth", attack: 1, health: 20 })],
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
        [pet({ type: "Sloth", attack: 1, health: 10 })],
        [pet({ type: "Peacock", attack: 2, health: 5, perk: MelonPerk })],
        PET_REGISTRY
      );

      expect(steps[1].defenderTeam[0].attack).toBe(2);
    });

    it("does not trigger when health is removed", () => {
      const { steps } = simulateBattle(
        [pet({ type: "Skunk", attack: 3, health: 5 })],
        [pet({ type: "Sloth", attack: 1, health: 5 }), pet({ type: "Peacock", attack: 2, health: 10 })],
        PET_REGISTRY
      );

      expect(steps[1].defenderTeam[1].health).toBe(6);
      expect(steps[1].defenderTeam[1].attack).toBe(2);
    });
  });

  describe("Kangaroo — friend ahead attacks", () => {
    it.each([
      { level: 1, expected: "Kangaroo (3/3)" },
      { level: 2, expected: "Kangaroo (4/4)" },
      { level: 3, expected: "Kangaroo (5/5)" },
    ])("gains +$level/+$level when its friend ahead attacks at level $level", ({ level, expected }) => {
      const { steps } = simulateBattle(
        [pet({ type: "Sloth", attack: 1, health: 10 }), pet({ type: "Kangaroo", attack: 2, health: 2, level })],
        [pet({ type: "Sloth", attack: 1, health: 100 })],
        PET_REGISTRY
      );

      expect(petToString(steps[1].attackerTeam[1])).toBe(expected);
    });

    it("does not trigger from its own attack when a friend is behind", () => {
      const { steps } = simulateBattle(
        [pet({ type: "Kangaroo", attack: 2, health: 2, level: 1 }), pet({ type: "Sloth", attack: 1, health: 10 })],
        [pet({ type: "Sloth", attack: 1, health: 100 })],
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
        [pet({ type: "Elephant", attack: 3, health: 7, level }), pet({ type: "Sloth", attack: 1, health: 10 })],
        [pet({ type: "Sloth", attack: 1, health: 100 })],
        PET_REGISTRY
      );

      expect(steps[1].attackerTeam[1].health).toBe(expectedHealth);
    });

    it("targets only the nearest friend behind", () => {
      const { steps } = simulateBattle(
        [
          pet({ type: "Elephant", attack: 3, health: 7, level: 2 }),
          pet({ type: "Sloth", attack: 1, health: 10 }),
          pet({ type: "Sloth", attack: 1, health: 10 }),
        ],
        [pet({ type: "Sloth", attack: 1, health: 100 })],
        PET_REGISTRY
      );

      expect(steps[1].attackerTeam[1].health).toBe(8);
      expect(steps[1].attackerTeam[2].health).toBe(10);
    });

    it("retargets a living friend if the first one faints", () => {
      const { steps } = simulateBattle(
        [
          pet({ type: "Elephant", attack: 3, health: 7, level: 2 }),
          pet({ type: "Sloth", attack: 1, health: 1 }),
          pet({ type: "Sloth", attack: 1, health: 10 }),
        ],
        [pet({ type: "Sloth", attack: 1, health: 100 })],
        PET_REGISTRY
      );

      expect(steps[1].attackerTeam).toHaveLength(2);
      expect(steps[1].attackerTeam[1].health).toBe(9);
    });
  });

  describe("Armadillo — start of battle", () => {
    it.each([
      { level: 1, bonus: 8 },
      { level: 2, bonus: 16 },
      { level: 3, bonus: 24 },
    ])("gives all living pets +$bonus health at level $level", ({ level, bonus }) => {
      const { steps } = simulateBattle(
        [pet({ type: "Armadillo", attack: 4, health: 8, level }), pet({ type: "Sloth", attack: 1, health: 20 })],
        [pet({ type: "Sloth", attack: 1, health: 20 })],
        PET_REGISTRY
      );

      expect(steps[1].attackerTeam[0].health).toBe(7 + bonus);
      expect(steps[1].attackerTeam[1].health).toBe(20 + bonus);
      expect(steps[1].defenderTeam[0].health).toBe(16 + bonus);
    });

    it("does not buff pets at zero or negative health", () => {
      const armadillo = pet({ type: "Armadillo", attack: 4, health: 8 });
      const deadFriend = pet({ type: "Sloth", attack: 1, health: 0 });
      const overkilledFriend = pet({ type: "Sloth", attack: 1, health: -3 });
      const livingFriend = pet({ type: "Sloth", attack: 1, health: 10 });
      const ability = PET_REGISTRY.Armadillo.abilities.get(Trigger.start_of_battle);
      if (!ability || ability.trigger !== Trigger.start_of_battle) {
        throw new Error("Expected Armadillo start-of-battle ability");
      }

      ability.fn(
        battleContext(armadillo, [armadillo, deadFriend, overkilledFriend, livingFriend], [])
      );

      expect(armadillo.health).toBe(16);
      expect(deadFriend.health).toBe(0);
      expect(overkilledFriend.health).toBe(-3);
      expect(livingFriend.health).toBe(18);
    });
  });

  describe("Hedgehog — faint", () => {
    it.each([
      { level: 1, damage: 2, expectedHealth: 8 },
      { level: 2, damage: 4, expectedHealth: 6 },
      { level: 3, damage: 6, expectedHealth: 4 },
    ])("deals $damage damage to every living pet on both teams at level $level", ({ level, expectedHealth }) => {
      const hedgehog = pet({ type: "Hedgehog", attack: 4, health: 0, level });
      const livingFriend = pet({ type: "Sloth", attack: 1, health: 10 });
      const deadFriend = pet({ type: "Sloth", attack: 1, health: 0 });
      const enemy = pet({ type: "Sloth", attack: 1, health: 10 });
      const ability = PET_REGISTRY.Hedgehog.abilities.get(Trigger.faint);
      if (!ability || ability.trigger !== Trigger.faint)
        throw new Error("Expected faint ability");

      ability.fn(battleContext(hedgehog, [hedgehog, livingFriend, deadFriend], [enemy]));

      expect(livingFriend.health).toBe(expectedHealth);
      expect(deadFriend.health).toBe(0);
      expect(enemy.health).toBe(expectedHealth);
    });
  });

  describe("Flamingo — faint", () => {
    it.each([
      { level: 1, expected: ["Sloth (2/6)", "Sloth (2/6)", "Sloth (1/5)", "Sloth (1/5)"] },
      { level: 2, expected: ["Sloth (3/7)", "Sloth (3/7)", "Sloth (1/5)", "Sloth (1/5)"] },
      { level: 3, expected: ["Sloth (4/8)", "Sloth (4/8)", "Sloth (1/5)", "Sloth (1/5)"] },
    ])("gives the two nearest friends behind +$level/+$level at level $level", ({ level, expected }) => {
      const flamingo = pet({ type: "Flamingo", attack: 3, health: 0, level });
      const friends = [pet({ type: "Sloth", attack: 1, health: 5 }), pet({ type: "Sloth", attack: 1, health: 5 }), pet({ type: "Sloth", attack: 1, health: 5 }), pet({ type: "Sloth", attack: 1, health: 5 })];
      const ability = PET_REGISTRY.Flamingo.abilities.get(Trigger.faint);
      if (!ability || ability.trigger !== Trigger.faint) throw new Error("Expected faint ability");

      ability.fn(battleContext(flamingo, [flamingo, ...friends], []));

      expect(friends.map(petToString)).toEqual(expected);
    });

    it("skips pending faints and buffs the nearest living friends behind", () => {
      const flamingo = pet({ type: "Flamingo", attack: 3, health: 0 });
      const deadFriend = pet({ type: "Sloth", attack: 1, health: 0 });
      const firstFriend = pet({ type: "Sloth", attack: 1, health: 5 });
      const secondFriend = pet({ type: "Sloth", attack: 1, health: 5 });
      const thirdFriend = pet({ type: "Sloth", attack: 1, health: 5 });
      const team = [flamingo, deadFriend, firstFriend, secondFriend, thirdFriend];
      const ability = PET_REGISTRY.Flamingo.abilities.get(Trigger.faint);
      if (!ability || ability.trigger !== Trigger.faint) throw new Error("Expected faint ability");

      ability.fn(battleContext(flamingo, team, []));

      expect(deadFriend).toMatchObject({ attack: 1, health: 0 });
      expect(firstFriend).toMatchObject({ attack: 2, health: 6 });
      expect(secondFriend).toMatchObject({ attack: 2, health: 6 });
      expect(thirdFriend).toMatchObject({ attack: 1, health: 5 });
    });
  });

  describe("Camel — hurt", () => {
    it.each([
      { level: 1, ability: "+1/+2", result: "Sloth (2/12)" },
      { level: 2, ability: "+2/+4", result: "Sloth (3/14)" },
      { level: 3, ability: "+3/+6", result: "Sloth (4/16)" },
    ])("gives the nearest friend behind $ability when damaged at level $level", ({ level, result }) => {
      const { steps } = simulateBattle(
        [pet({ type: "Camel", attack: 3, health: 3, level }), pet({ type: "Sloth", attack: 1, health: 10 })],
        [pet({ type: "Sloth", attack: 1, health: 100 })],
        PET_REGISTRY
      );

      expect(petToString(steps[1].attackerTeam[1])).toBe(result);
    });

    it("skips a pending faint to buff the nearest living friend behind", () => {
      const camel = pet({ type: "Camel", attack: 3, health: 3 });
      const deadFriend = pet({ type: "Sloth", attack: 1, health: 0 });
      const livingFriend = pet({ type: "Sloth", attack: 1, health: 10 });
      const ability = PET_REGISTRY.Camel.abilities.get(Trigger.hurt);
      if (!ability || ability.trigger !== Trigger.hurt) throw new Error("Expected hurt ability");

      ability.fn(battleContext(camel, [camel, deadFriend, livingFriend], []));

      expect(deadFriend).toMatchObject({ attack: 1, health: 0 });
      expect(livingFriend).toMatchObject({ attack: 2, health: 12 });
    });
  });

  describe("Blowfish — hurt", () => {
    it.each([
      { level: 1, damage: 3, expectedHealth: 14 },
      { level: 2, damage: 6, expectedHealth: 11 },
      { level: 3, damage: 9, expectedHealth: 8 },
    ])("deals $damage ability damage to an enemy after taking a hit at level $level", ({ level, expectedHealth }) => {
      const { steps } = simulateBattle(
        [pet({ type: "Blowfish", attack: 3, health: 6, level })],
        [pet({ type: "Sloth", attack: 1, health: 20 })],
        PET_REGISTRY
      );

      expect(steps[1].defenderTeam[0].health).toBe(expectedHealth);
    });
  });

  describe("Sheep — faint", () => {
    it.each([
      { level: 1, ram: "Ram (2/2)" },
      { level: 2, ram: "Ram (4/4)" },
      { level: 3, ram: "Ram (6/6)" },
    ])("summons two $ram at level $level", ({ level, ram }) => {
      const { steps } = simulateBattle(
        [pet({ type: "Sheep", attack: 2, health: 2, level })],
        [pet({ type: "Sloth", attack: 2, health: 2 })],
        PET_REGISTRY
      );

      expect(steps[1].attackerTeam.map(petToString)).toEqual([ram, ram]);
    });

    it("flings the second Ram when the team has room for only one summon", () => {
      const { steps } = simulateBattle(
        [
          pet({ type: "Sheep", attack: 2, health: 1 }),
          pet({ type: "Sloth", attack: 1, health: 10 }),
          pet({ type: "Sloth", attack: 1, health: 10 }),
          pet({ type: "Sloth", attack: 1, health: 10 }),
          pet({ type: "Sloth", attack: 1, health: 10 }),
        ],
        [pet({ type: "Sloth", attack: 2, health: 10 })],
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
      const turtle = pet({ type: "Turtle", attack: 2, health: 0, level });
      const friends = [pet({ type: "Sloth", attack: 1, health: 5 }), pet({ type: "Sloth", attack: 1, health: 5 }), pet({ type: "Sloth", attack: 1, health: 5 }), pet({ type: "Sloth", attack: 1, health: 5 })];
      const ability = PET_REGISTRY.Turtle.abilities.get(Trigger.faint);
      if (!ability || ability.trigger !== Trigger.faint) throw new Error("Expected faint ability");

      ability.fn(battleContext(turtle, [turtle, ...friends], []));

      expect(friends.map((friend) => friend.perk?.name ?? null)).toEqual(perks);
    });

    it("skips pending faints when giving Melon", () => {
      const turtle = pet({ type: "Turtle", attack: 2, health: 0 });
      const deadFriend = pet({ type: "Sloth", attack: 1, health: 0 });
      const firstFriend = pet({ type: "Sloth", attack: 1, health: 5 });
      const secondFriend = pet({ type: "Sloth", attack: 1, health: 5 });
      const ability = PET_REGISTRY.Turtle.abilities.get(Trigger.faint);
      if (!ability || ability.trigger !== Trigger.faint) throw new Error("Expected faint ability");

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
        [pet({ type: "Rooster", attack: 6, health: 4, level })],
        [pet({ type: "Sloth", attack: 4, health: 100 })],
        PET_REGISTRY
      );

      expect(steps[1].attackerTeam.map(petToString)).toEqual(expected);
    });

    it("rounds half its attack down", () => {
      const { steps } = simulateBattle(
        [pet({ type: "Rooster", attack: 5, health: 4 })],
        [pet({ type: "Sloth", attack: 4, health: 100 })],
        PET_REGISTRY
      );

      expect(petToString(steps[1].attackerTeam[0])).toBe("Chick (2/1)");
    });

    it("does not summon a Chick with 0 attack", () => {
      const { steps } = simulateBattle(
        [pet({ type: "Rooster", attack: 1, health: 1 })],
        [pet({ type: "Sloth", attack: 4, health: 100 })],
        PET_REGISTRY
      );

      expect(steps[1].attackerTeam).toHaveLength(0);
    });
  });

  describe("Mammoth — faint", () => {
    it("buffs living friends but not itself or pending faints", () => {
      const mammoth = pet({ type: "Mammoth", attack: 4, health: 0 });
      const deadFriend = pet({ type: "Sloth", attack: 1, health: 0 });
      const livingFriend = pet({ type: "Sloth", attack: 1, health: 10 });
      const ability = PET_REGISTRY.Mammoth.abilities.get(Trigger.faint);
      if (!ability || ability.trigger !== Trigger.faint) throw new Error("Expected faint ability");

      ability.fn(battleContext(mammoth, [mammoth, deadFriend, livingFriend], []));

      expect(mammoth.health).toBe(0);
      expect(deadFriend.health).toBe(0);
      expect(livingFriend).toMatchObject({ attack: 3, health: 12 });
    });
  });

  describe("Ox — friend ahead faints", () => {
    it.each([
      { level: 1, result: "Ox (2/3)" },
      { level: 2, result: "Ox (3/3)" },
      { level: 3, result: "Ox (4/3)" },
    ])("gains Melon and +$level attack when its friend ahead faints at level $level", ({ level, result }) => {
      const { steps } = simulateBattle(
        [pet({ type: "Sloth", attack: 1, health: 1 }), pet({ type: "Ox", attack: 1, health: 3, level })],
        [pet({ type: "Sloth", attack: 1, health: 100 })],
        registryWith(Ox)
      );

      expect(petToString(steps[1].attackerTeam[0])).toBe(result);
      expect(steps[1].attackerTeam[0].perk?.name).toBe("Melon");
    });

    it("does not trigger when a friend further ahead faints", () => {
      const { steps } = simulateBattle(
        [pet({ type: "Sloth", attack: 1, health: 1 }), pet({ type: "Sloth", attack: 1, health: 10 }), pet({ type: "Ox", attack: 1, health: 3 })],
        [pet({ type: "Sloth", attack: 1, health: 100 })],
        registryWith(Ox)
      );

      expect(petToString(steps[1].attackerTeam[1])).toBe("Ox (1/3)");
      expect(steps[1].attackerTeam[1].perk).toBeNull();
    });

    it("works once per turn in battle", () => {
      const { steps } = simulateBattle(
        [pet({ type: "Sloth", attack: 1, health: 1, perk: HoneyPerk }), pet({ type: "Ox", attack: 1, health: 3 })],
        [pet({ type: "Sloth", attack: 1, health: 100 })],
        registryWith(Ox)
      );

      expect(steps[2].attackerTeam.map(petToString)).toEqual(["Ox (2/3)"]);
    });

    it("does not trigger in battle after triggering in the shop that turn", () => {
      const { steps } = simulateBattle(
        [
          pet({ type: "Sloth", attack: 1, health: 1 }),
          {
            ...pet({ type: "Ox", attack: 1, health: 3 }),
            triggerCountsThisTurn: { [Trigger.friend_ahead_faints]: 1 },
          },
        ],
        [pet({ type: "Sloth", attack: 1, health: 100 })],
        registryWith(Ox)
      );

      expect(petToString(steps[1].attackerTeam[0])).toBe("Ox (1/3)");
    });
  });

  describe("Snake — friend ahead attacks", () => {
    it.each([
      { level: 1, damage: 5, expectedHealth: 194 },
      { level: 2, damage: 10, expectedHealth: 189 },
      { level: 3, damage: 15, expectedHealth: 184 },
    ])("deals $damage damage to a random enemy at level $level", ({ level, expectedHealth }) => {
      const { steps } = simulateBattle(
        [pet({ type: "Sloth", attack: 1, health: 100 }), pet({ type: "Snake", attack: 8, health: 3, level })],
        [pet({ type: "Sloth", attack: 1, health: 200 })],
        PET_REGISTRY
      );

      expect(steps[1].defenderTeam[0].health).toBe(expectedHealth);
    });

    it("deals damage at most five times", () => {
      const { steps } = simulateBattle(
        [pet({ type: "Sloth", attack: 1, health: 100 }), pet({ type: "Snake", attack: 8, health: 3 })],
        [pet({ type: "Sloth", attack: 1, health: 200 })],
        PET_REGISTRY
      );

      expect(steps.at(-1)?.defenderTeam[0].health).toBe(125);
    });
  });

  describe("Rabbit — food gained by ability", () => {
    const tripleFeeder = abilityPet("Triple Feeder", {
      trigger: Trigger.start_of_battle,
      fn: (ctx) => {
        for (let i = 0; i < 3; i++) new BattleActions(ctx).friendAteFood(ctx.team[1]);
      },
    });

    it("has only the triggers left over from the shop", () => {
      const { steps } = simulateBattle(
        [
          pet({ type: "Triple Feeder", attack: 1, health: 50 }),
          {
            ...pet({ type: "Rabbit", attack: 1, health: 5 }),
            triggerCountsThisTurn: { [Trigger.friend_ate_food]: 1 },
          },
        ],
        [pet({ type: "Sloth", attack: 1, health: 50 })],
        registryWith(tripleFeeder)
      );

      expect(steps[1].attackerTeam[1].health).toBe(7);
    });

    it("does not carry battle triggers back to the shop", () => {
      const rabbit = {
        ...pet({ type: "Rabbit", attack: 1, health: 5 }),
        triggerCountsThisTurn: { [Trigger.friend_ate_food]: 1 },
      };
      simulateBattle(
        [pet({ type: "Triple Feeder", attack: 1, health: 50 }), rabbit],
        [pet({ type: "Sloth", attack: 1, health: 50 })],
        registryWith(tripleFeeder)
      );

      expect(rabbit.triggerCountsThisTurn?.[Trigger.friend_ate_food]).toBe(1);
    });

    it("triggers when a battle ability gives a friend a perk", () => {
      const perkGiver = abilityPet("Perk Giver", {
        trigger: Trigger.start_of_battle,
        fn: (ctx) => {
          const friend = ctx.team[1];
          if (!friend) return;
          friend.perk = MelonPerk;
          new BattleActions(ctx).friendAteFood(friend);
        },
      });
      const { steps } = simulateBattle(
        [pet({ type: "Perk Giver", attack: 1, health: 50 }), pet({ type: "Rabbit", attack: 1, health: 5 })],
        [pet({ type: "Sloth", attack: 1, health: 50 })],
        registryWith(perkGiver)
      );

      expect(steps[1].attackerTeam[1].health).toBe(6);
      expect(steps[1].attackerTeam[1].perk).toEqual(MelonPerk);
    });
  });

  describe("Ability-granted experience", () => {
    it("still grants stats at max XP without exceeding the cap", () => {
      const experienceGiver = abilityPet("Experience Giver", {
        trigger: Trigger.start_of_battle,
        fn: (ctx) => {
          const target = ctx.team[1];
          if (target) grantExperience(target, 1);
        },
      });
      const { steps } = simulateBattle(
        [pet({ type: "Experience Giver", attack: 1, health: 50 }), pet({ type: "Sloth", attack: 2, health: 2, level: 3 })],
        [pet({ type: "Sloth", attack: 1, health: 50 })],
        registryWith(experienceGiver)
      );

      expect(steps[1].attackerTeam[1]).toMatchObject({
        attack: 3,
        health: 3,
        xp: 5,
        level: 3,
      });
    });
  });

  describe("Abilities cannot target pending faints", () => {
    it("does not run a pending-faint Dog's friend-summoned ability", () => {
      const summoner = abilityPet("Summoner", {
        trigger: Trigger.start_of_battle,
        fn: (ctx) => new BattleActions(ctx).summon(pet({ type: "Sloth", attack: 1, health: 1 }), ctx.selfIndex),
      });
      const { steps } = simulateBattle(
        [pet({ type: summoner.name, attack: 1, health: 50 }), pet({ type: "Dog", attack: 3, health: 0 })],
        [pet({ type: "Sloth", attack: 1, health: 100 })],
        registryWith(summoner)
      );

      expect(steps[1].attackerTeam.some((friend) => friend.type === "Dog")).toBe(false);
    });

    it("Mosquito only selects enemies with health remaining", () => {
      const deadEnemy = pet({ type: "Sloth", attack: 1, health: 0 });
      const livingEnemy = pet({ type: "Sloth", attack: 1, health: 10 });
      const mosquito = pet({ type: "Mosquito", attack: 2, health: 2 });
      const ability = PET_REGISTRY.Mosquito.abilities.get(Trigger.start_of_battle);
      if (!ability || ability.trigger !== Trigger.start_of_battle) throw new Error("Expected Mosquito start-of-battle ability");

      ability.fn(battleContext(mosquito, [mosquito], [deadEnemy, livingEnemy]));

      expect(deadEnemy.health).toBe(0);
      expect(livingEnemy.health).toBe(9);
    });

    it("Elephant skips a pending faint and targets the nearest living friend behind", () => {
      const elephant = pet({ type: "Elephant", attack: 3, health: 7 });
      const deadFriend = pet({ type: "Sloth", attack: 1, health: 0 });
      const livingFriend = pet({ type: "Sloth", attack: 1, health: 10 });
      const team = [elephant, deadFriend, livingFriend];
      const ability = PET_REGISTRY.Elephant.abilities.get(Trigger.after_attack);
      if (!ability || ability.trigger !== Trigger.after_attack) throw new Error("Expected Elephant after-attack ability");

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
          [pet({ type: "Mosquito", attack: 2, health: 2, level })],
          [pet({ type: "Sloth", attack: 2, health: 1 }), pet({ type: "Sloth", attack: 2, health: 1 }), pet({ type: "Sloth", attack: 2, health: 1 })],
          PET_REGISTRY
        );

        expect(result).toBe(expected);
      }
    );

    // TODO - Update test. Does not verify behavior (i.e. no teammates to hit, if teammate was hit instead, the test would still pass)
    it("does not deal damage to own team", () => {
      // Single Mosquito vs single strong Sloth. Start-of-battle only hits enemy.
      const { result } = simulateBattle(
        [pet({ type: "Mosquito", attack: 2, health: 2 })],
        [pet({ type: "Sloth", attack: 2, health: 10 })],
        PET_REGISTRY
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
          [pet({ type: "Ant", attack: 1, health: 1, level }), pet({ type: "Sloth", attack: 1, health: 1 })],
          [pet({ type: "Sloth", attack: 5, health: 5 })],
          PET_REGISTRY
        );

        expect(petToString(steps[1].attackerTeam[0])).toBe(result);
      }
    );

    it("no-op when no friends remain", () => {
      // Solo Ant vs stronger opponent — no friends to buff, should not crash.
      const { result } = simulateBattle(
        [pet({ type: "Ant", attack: 2, health: 2 })],
        [pet({ type: "Sloth", attack: 5, health: 5 })],
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
    ])(
      "at level $level summons a $level/$level Zombie Cricket",
      ({ level, result }) => {
        const { steps } = simulateBattle(
          [pet({ type: "Cricket", attack: 1, health: 1, level })],
          [pet({ type: "Sloth", attack: 1, health: 1 })],
          PET_REGISTRY
        );

        expect(petToString(steps[1].attackerTeam[0])).toBe(result);
      }
    );
  });

  describe("Dog — friend summoned", () => {
    it.each([
      { level: 1, ability: "+2/+1", result: "Dog (5/3)" },
      { level: 2, ability: "+4/+2", result: "Dog (7/4)" },
      { level: 3, ability: "+6/+3", result: "Dog (9/5)" },
    ])("gains $ability when a friend is summoned at level $level", ({ level, result }) => {
      const { steps } = simulateBattle(
        [pet({ type: "Cricket", attack: 1, health: 1 }), pet({ type: "Dog", attack: 3, health: 2, level })],
        [pet({ type: "Sloth", attack: 1, health: 10 })],
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
        [pet({ type: "Cricket", attack: 1, health: 1 }), pet({ type: "Turkey", attack: 3, health: 4, level })],
        [pet({ type: "Sloth", attack: 1, health: 10 })],
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
          [pet({ type: "Cricket", attack: 1, health: 1 }), pet({ type: "Horse", attack: 2, health: 1, level })],
          [pet({ type: "Sloth", attack: 2, health: 10 })],
          PET_REGISTRY
        );

        const stepAfterRound1 = steps[1];
        expect(petToString(stepAfterRound1.attackerTeam[0])).toBe(result);
      }
    );
  });

  describe("Dodo — start-of-battle", () => {
    it.each([
      { level: 1, ability: "50%", result: "Ant (3/5)" },
      { level: 2, ability: "100%", result: "Ant (5/5)" },
      { level: 3, ability: "150%", result: "Ant (7/5)" },
    ])(
      "gives $ability of its attack to the nearest friend ahead at level $level",
      ({ level, result }) => {
        const { steps } = simulateBattle(
          [pet({ type: "Sloth", attack: 1, health: 5 }), pet({ type: "Ant", attack: 1, health: 5 }), pet({ type: "Dodo", attack: 4, health: 2, level })],
          [pet({ type: "Sloth", attack: 1, health: 50 })],
          PET_REGISTRY
        );

        expect(petToString(steps[0].attackerTeam[1])).toBe("Ant (1/5)");
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

        const friendAhead = pet({ type: "Sloth", attack: 1, health: allyHealth });
        const friendBehind = pet({ type: "Sloth", attack: 1, health: allyHealth });
        const { result } = simulateBattle(
          [friendBehind, pet({ type: "Badger", attack: 6, health: 1, level }), friendAhead],
          [pet({ type: "Dolphin", attack: 1, health: 1 })],
          PET_REGISTRY
        );

        expect(result).toBe("LOSE");
      }
    );

    // TODO - Consider changing to verify if enemy is hit, once logic is implemented
    it("deals splash damage to closest friend behind on faint", () => {
      const { result, steps } = simulateBattle(
        [pet({ type: "Badger", attack: 6, health: 1 }), pet({ type: "Sloth", attack: 1, health: 5 }), pet({ type: "Sloth", attack: 1, health: 5 })],
        [pet({ type: "Sloth", attack: 5, health: 1 })],
        PET_REGISTRY
      );
      // Badger (6/1) and the enemy Sloth (5/1) trade and both die.
      // Badger's faint: no friend ahead, friend behind takes 3 dmg → 1/2.
      expect(result).toBe("WIN");
      expect(steps[1].attackerTeam[0].health).toBe(2);
    });

    it("hits the front enemy when it is at the front of its team", () => {
      const badger = pet({ type: "Badger", attack: 6, health: 0 });
      const enemy = pet({ type: "Sloth", attack: 1, health: 10 });
      const ability = PET_REGISTRY.Badger.abilities.get(Trigger.faint);
      if (!ability || ability.trigger !== Trigger.faint) throw new Error("Expected Badger faint ability");

      ability.fn(battleContext(badger, [badger], [enemy]));

      expect(enemy.health).toBe(7);
    });

    it("skips pending faints", () => {
      const deadFriendAhead = pet({ type: "Sloth", attack: 1, health: 0 });
      const badger = pet({ type: "Badger", attack: 6, health: 0 });
      const deadFriendBehind = pet({ type: "Sloth", attack: 1, health: 0 });
      const livingFriendBehind = pet({ type: "Sloth", attack: 1, health: 10 });
      const deadEnemyFront = pet({ type: "Sloth", attack: 1, health: 0 });
      const livingEnemyBehind = pet({ type: "Sloth", attack: 1, health: 10 });
      const team = [deadFriendAhead, badger, deadFriendBehind, livingFriendBehind];
      const ability = PET_REGISTRY.Badger.abilities.get(Trigger.faint);
      if (!ability || ability.trigger !== Trigger.faint) throw new Error("Expected Badger faint ability");

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
          [pet({ type: "Dolphin", attack: 4, health: 3, level })],
          [pet({ type: "Sloth", attack: 1, health: 49 }), pet({ type: "Sloth", attack: 1, health: 50 })],
          PET_REGISTRY
        );

        expect(steps[1].description).toContain(result);
      }
    );

    it("repeats the hit `level` times, re-targeting whichever enemy is currently lowest health", () => {
      const { result } = simulateBattle(
        [pet({ type: "Dolphin", attack: 1, health: 1, level: 2 })],
        [pet({ type: "Sloth", attack: 1, health: 4 }), pet({ type: "Sloth", attack: 1, health: 4 })],
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
          [pet({ type: "Skunk", attack: 3, health: 5, level })],
          [pet({ type: "Sloth", attack: 1, health: 10 })],
          PET_REGISTRY
        );

        expect(steps[1].description).toContain(result);
      }
    );

    it("cannot reduce a pet's health below 1", () => {
      const { steps } = simulateBattle(
        [pet({ type: "Skunk", attack: 3, health: 5 })],
        [pet({ type: "Sloth", attack: 1, health: 1 })],
        PET_REGISTRY
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
          [pet({ type: "Crab", attack: 4, health: 1, level }), pet({ type: "Sloth", attack: 1, health: 20 })],
          [pet({ type: "Sloth", attack: 1, health: 50 })],
          PET_REGISTRY
        );

        expect(steps[1].description).toContain(result);
      }
    );

    it("no-op when there are no friends", () => {
      const { steps } = simulateBattle(
        [pet({ type: "Crab", attack: 4, health: 1 })],
        [pet({ type: "Sloth", attack: 1, health: 50 })],
        PET_REGISTRY
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
        [pet({ type: "Leopard", attack: 2, health: 2, level })],
        [pet({ type: "Sloth", attack: 2, health: 1 }), pet({ type: "Sloth", attack: 2, health: 1 }), pet({ type: "Sloth", attack: 2, health: 1 })],
        PET_REGISTRY
      );

      expect(result).toBe(expected);
    });

    it("snipes deal 50% of attack damage", () => {
      const { steps } = simulateBattle(
        [pet({ type: "Leopard", attack: 10, health: 4 })],
        [pet({ type: "Sloth", attack: 1, health: 10 })],
        PET_REGISTRY
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
        [pet({ type: "Boar", attack: 10, health: 6, level })],
        [pet({ type: "Sloth", attack: 1, health: 100 })],
        PET_REGISTRY
      );

      expect(steps[1].description).toContain(result);
    });

    it("retriggers", () => {
      const { steps } = simulateBattle(
        [pet({ type: "Boar", attack: 10, health: 6 })],
        [pet({ type: "Sloth", attack: 1, health: 100 })],
        PET_REGISTRY
      );

      expect(steps[1].description).toContain("Boar (14/8)");
      expect(steps[2].description).toContain("Boar (18/9)");
      expect(steps[3].description).toContain("Boar (22/10)");
      expect(steps[4].description).toContain("Boar (26/11)");
    });
  });

  describe("Hippo — knock-out", () => {
    it.each([
      { level: 1, ability: "+3/+3", result: "Hippo (7/9)" },
      { level: 2, ability: "+6/+6", result: "Hippo (10/12)" },
      { level: 3, ability: "+9/+9", result: "Hippo (13/15)" },
    ])("gains $ability per knock-out at level $level", ({ level, result }) => {
      const { steps } = simulateBattle(
        [pet({ type: "Hippo", attack: 4, health: 7, level })],
        [pet({ type: "Sloth", attack: 1, health: 1 })],
        PET_REGISTRY
      );

      expect(petToString(steps[1].attackerTeam[0])).toBe(result);
    });

    it("is capped at 3 triggers per battle", () => {
      const { steps } = simulateBattle(
        [pet({ type: "Hippo", attack: 4, health: 7 })],
        [
          pet({ type: "Sloth", attack: 1, health: 1 }),
          pet({ type: "Sloth", attack: 1, health: 1 }),
          pet({ type: "Sloth", attack: 1, health: 1 }),
          pet({ type: "Sloth", attack: 1, health: 1 }),
          pet({ type: "Sloth", attack: 1, health: 1 }),
        ],
        PET_REGISTRY
      );

      const lastStep = steps[steps.length - 1];
      expect(petToString(lastStep.attackerTeam[0])).toContain("Hippo (13/11)");
    });
  });

  describe("Rhino — knock-out", () => {
    const RHINO_ABILITY_DAMAGE = 4;
    const TIER_1_MULTIPLIER = 2;

    it.each([
      { level: 1, ability_damage: RHINO_ABILITY_DAMAGE },
      { level: 2, ability_damage: RHINO_ABILITY_DAMAGE * 2 },
      { level: 3, ability_damage: RHINO_ABILITY_DAMAGE * 3 },
    ])(
      "deals $ability_damage damage to next non-tier 1 enemy at level $level",
      ({ level }) => {
        const { steps } = simulateBattle(
          [pet({ type: "Rhino", attack: 6, health: 7, level })],
          [pet({ type: "Sloth", attack: 1, health: 1 }), pet({ type: "Dodo", attack: 1, health: 50 })],
          PET_REGISTRY
        );

        expect(steps[1].defenderTeam[0].health).toBe(50 - 4 * level);
      }
    );

    it.each([
      { level: 1, ability_damage: TIER_1_MULTIPLIER * RHINO_ABILITY_DAMAGE },
      {
        level: 2,
        ability_damage: TIER_1_MULTIPLIER * RHINO_ABILITY_DAMAGE * 2,
      },
      {
        level: 3,
        ability_damage: TIER_1_MULTIPLIER * RHINO_ABILITY_DAMAGE * 3,
      },
    ])(
      "deals $ability_damage damage to next non-tier 1 enemy at level $level",
      ({ level }) => {
        const { steps } = simulateBattle(
          [pet({ type: "Rhino", attack: 6, health: 7, level })],
          [pet({ type: "Sloth", attack: 1, health: 1 }), pet({ type: "Sloth", attack: 1, health: 50 })],
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
          [pet({ type: "Crocodile", attack: 8, health: 4, level })],
          [pet({ type: "Sloth", attack: 1, health: 30 }), pet({ type: "Sloth", attack: 1, health: 30 })],
          PET_REGISTRY
        );

        expect(steps[1].defenderTeam[1].health).toBe(30 - level * 8);
      }
    );

    it("deals repeated damage separately", () => {
      const { steps } = simulateBattle(
        [pet({ type: "Crocodile", attack: 8, health: 4, level: 2 })],
        [pet({ type: "Sloth", attack: 1, health: 20 }), pet({ type: "Sloth", attack: 1, health: 8 })],
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
        [pet({ type: "Ant", attack: 1, health: 1 }), pet({ type: "Tiger", attack: 6, health: 4, level: 1 })],
        [pet({ type: "Sloth", attack: 1, health: 100 })],
        PET_REGISTRY
      );

      expect(steps[1].attackerTeam[0]).toMatchObject({
        type: "Tiger",
        attack: 8,
        health: 6,
      });
    });

    it.each([
      { tigerLevel: 1, removal: 6 + 3 },
      { tigerLevel: 2, removal: 6 + 6 },
      { tigerLevel: 3, removal: 6 + 9 },
    ])(
      "repeats Wolverine at Tiger level $tigerLevel without counting the hurt twice",
      ({ tigerLevel, removal }) => {
        const damageFriend = abilityPet("Friend Hurter", {
          trigger: Trigger.start_of_battle,
          fn: (ctx) => {
            const target = ctx.team.find((friend) => friend.type === "Target");
            if (!target) return;
            for (let i = 0; i < 4; i++) {
              new BattleActions(ctx).dealAbilityDamage(target, 1);
            }
          },
        });
        const { steps } = simulateBattle(
          [
            pet({ type: damageFriend.name, attack: 0, health: 100 }),
            pet({ type: "Target", attack: 1, health: 100 }),
            pet({ type: "Wolverine", attack: 5, health: 7, level: 2 }),
            pet({ type: "Tiger", attack: 1, health: 50, level: tigerLevel }),
          ],
          [pet({ type: "Sloth", attack: 0, health: 100 })],
          registryWith(damageFriend)
        );

        expect(steps[1].defenderTeam[0].health).toBe(100 - removal);
      }
    );

    it.each([
      // Dodo gives 2 attack itself, then the repeat gives 2 per Tiger level.
      { level: 1, result: "Sloth (5/5)" },
      { level: 2, result: "Sloth (7/5)" },
      { level: 3, result: "Sloth (9/5)" },
    ])(
      "makes the friend directly ahead repeat their battle ability at level $level",
      ({ level, result }) => {
        const { steps } = simulateBattle(
          [
            pet({ type: "Sloth", attack: 1, health: 5 }),
            pet({ type: "Dodo", attack: 4, health: 2 }),
            pet({ type: "Tiger", attack: 6, health: 4, level }),
          ],
          [pet({ type: "Sloth", attack: 1, health: 50 })],
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
      const honeySloth = pet({ type: "Sloth", attack: 1, health: 1, perk: HoneyPerk });
      const opponent = pet({ type: "Sloth", attack: 2, health: 2 });

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
          pet({ type: "Cricket", attack: 1, health: 1, perk: HoneyPerk }),
          pet({ type: "Sloth", attack: 1, health: 10 }),
          pet({ type: "Sloth", attack: 1, health: 10 }),
          pet({ type: "Sloth", attack: 1, health: 10 }),
          pet({ type: "Sloth", attack: 1, health: 10 }),
        ],
        [pet({ type: "Sloth", attack: 2, health: 10 })],
        PET_REGISTRY
      );

      expect(steps[1].attackerTeam).toHaveLength(5);
      expect(steps[1].attackerTeam[0].type).toBe("Zombie Cricket");
      expect(steps[1].attackerTeam.some((friend) => friend.type === "Bee")).toBe(false);
    });

    it("does not mutate input teams", () => {
      const honeySloth: PetInstance = pet({ type: "Sloth", attack: 1, health: 1, perk: HoneyPerk });
      const opponent = pet({ type: "Sloth", attack: 2, health: 2 });
      simulateBattle([honeySloth], [opponent], PET_REGISTRY);
      expect(honeySloth.health).toBe(1);
      expect(opponent.health).toBe(2);
    });
  });

  describe("Peanut perk — lethal on hit", () => {
    it("knocks out any pet it deals damage to in combat", () => {
      const scorpion = pet({ type: "Scorpion", attack: 1, health: 3, perk: PeanutPerk });
      const { result, steps } = simulateBattle(
        [scorpion],
        [pet({ type: "Sloth", attack: 1, health: 100 })],
        PET_REGISTRY
      );
      expect(result).toBe("WIN");
      expect(steps).toHaveLength(2); // Battle start + 1 round: the single hit is lethal
    });

    it("Peanut requires damage to kill", () => {
      const scorpion = pet({ type: "Scorpion", attack: 1, health: 3, perk: PeanutPerk });
      const melonSloth: PetInstance = pet({ type: "Sloth", attack: 1, health: 3, perk: MelonPerk });
      const { steps } = simulateBattle([scorpion], [melonSloth], PET_REGISTRY);

      // Scorpion's 1 dmg is fully blocked (min(20,1)=1) — Sloth takes 0, so it
      // wasn't "hurt" and Peanut's instakill does not apply.
      expect(steps[1].defenderTeam[0].health).toBe(3);
    });
  });

  describe("Whale — start of battle and faint", () => {
    it.each([{ level: 1 }, { level: 2 }, { level: 3 }])(
      "releases the nearest friend ahead at Whale level $level without its perk",
      ({ level }) => {
        let faintTriggers = 0;
        const swallowTarget = abilityPet("Swallow Target", {
          trigger: Trigger.faint,
          fn: () => faintTriggers++,
        });
        const swallowed = pet({ type: "Swallow Target", attack: 9, health: 1000, perk: MelonPerk });
        const { steps } = simulateBattle(
          [pet({ type: "Sloth", attack: 1, health: 1 }), swallowed, pet({ type: "Whale", attack: 3, health: 7, level })],
          [pet({ type: "Sloth", attack: 10, health: 1000 })],
          registryWith(swallowTarget)
        );

        expect(steps[1].attackerTeam.map((friend) => friend.type)).toEqual([
          "Whale",
        ]);
        expect(steps[2].attackerTeam[0]).toMatchObject({
          type: "Swallow Target",
          attack: 9,
          health: 1000,
          perk: null,
          level,
          xp: getMinimumXpFor(level),
        });
        expect(faintTriggers).toBe(0);
      }
    );

    it("releases at the level Whale swallowed at, not the level it faints at", () => {
      const leveler = abilityPet("Whale Leveler", {
        trigger: Trigger.start_of_battle,
        fn: (ctx) => {
          const whale = ctx.team.find((friend) => friend.type === "Whale");
          if (whale) grantExperience(whale, 5);
        },
      });
      const { steps } = simulateBattle(
        [pet({ type: "Sloth", attack: 1, health: 50 }), pet({ type: "Whale", attack: 3, health: 7 }), pet({ type: leveler.name, attack: 1, health: 50 })],
        [pet({ type: "Sloth", attack: 6, health: 1000 })],
        registryWith(leveler)
      );

      expect(steps[0].attackerTeam[1].level).toBe(1);
      expect(steps[1].attackerTeam[0]).toMatchObject({ type: "Whale", level: 3 });
      expect(steps[2].attackerTeam[0]).toMatchObject({
        type: "Sloth",
        level: 1,
        xp: 0,
      });
    });

    it("does not swallow the friend behind when there is no friend ahead", () => {
      const { steps } = simulateBattle(
        [pet({ type: "Whale", attack: 3, health: 7 }), pet({ type: "Cricket", attack: 1, health: 1 })],
        [pet({ type: "Sloth", attack: 1, health: 1000 })],
        PET_REGISTRY
      );

      expect(steps[1].attackerTeam.map((friend) => friend.type)).toEqual([
        "Whale",
        "Cricket",
      ]);
      expect(steps[1].attackerTeam[0].swallowedPets).toBeUndefined();
    });

    it("swallows and releases a second friend, at level 1, with a level 1 Tiger behind", () => {
      const { steps } = simulateBattle(
        [
          pet({ type: "Ant", attack: 2, health: 2 }),
          pet({ type: "Fish", attack: 2, health: 3 }),
          pet({ type: "Whale", attack: 3, health: 7, level: 2 }),
          pet({ type: "Tiger", attack: 1, health: 50 }),
        ],
        [pet({ type: "Sloth", attack: 100, health: 1000 })],
        registryWith()
      );

      expect(steps[1].attackerTeam.slice(0, 2)).toMatchObject([
        { type: "Fish", level: 2 },
        { type: "Ant", level: 1 },
      ]);
    });
  });

  describe("Wolverine — four friends hurt", () => {
    const hurter = (hits: number) =>
      abilityPet("Friend Hurter", {
        trigger: Trigger.start_of_battle,
        fn: (ctx) => {
          const target = ctx.team.find((friend) => friend.type === "Target");
          if (!target) return;
          for (let i = 0; i < hits; i++) {
            new BattleActions(ctx).dealAbilityDamage(target, 1);
          }
        },
      });

    it.each([
      { level: 1, removal: 3 },
      { level: 2, removal: 6 },
      { level: 3, removal: 9 },
    ])(
      "removes $removal health from every enemy after four friend hurts",
      ({ level, removal }) => {
        const { steps } = simulateBattle(
          [pet({ type: "Sloth", attack: 0, health: 100 }), pet({ type: "Wolverine", attack: 5, health: 7, level })],
          [pet({ type: "Sloth", attack: 1, health: 100 }), pet({ type: "Sloth", attack: 1, health: 100 })],
          PET_REGISTRY
        );
        const enemyHealth = (step: number) =>
          steps[step].defenderTeam.map((enemy) => enemy.health);

        expect(enemyHealth(3)).toEqual([100, 100]);
        expect(enemyHealth(4)).toEqual([100 - removal, 100 - removal]);
      }
    );

    it.each([
      { hits: 3, health: 100 },
      { hits: 7, health: 97 },
      { hits: 8, health: 94 },
    ])(
      "counts each of $hits hits on the same friend as a separate hurt",
      ({ hits, health }) => {
        const damageFriend = hurter(hits);
        const { steps } = simulateBattle(
          [
            pet({ type: damageFriend.name, attack: 0, health: 100 }),
            pet({ type: "Target", attack: 1, health: 100 }),
            pet({ type: "Wolverine", attack: 5, health: 7 }),
          ],
          [pet({ type: "Sloth", attack: 0, health: 100 })],
          registryWith(damageFriend)
        );

        expect(steps[0].defenderTeam[0].health).toBe(100);
        expect(steps[1].defenderTeam[0].health).toBe(health);
      }
    );

    it("only increments when other friends are hurt", () => {
      const damageSelf = abilityPet("Self Hurter", {
        trigger: Trigger.start_of_battle,
        fn: (ctx) => {
          for (let i = 0; i < 4; i++) {
            new BattleActions(ctx).dealAbilityDamage(ctx.team[1], 1);
          }
        },
      });
      const { steps } = simulateBattle(
        [pet({ type: damageSelf.name, attack: 0, health: 100 }), pet({ type: "Wolverine", attack: 5, health: 7 })],
        [pet({ type: "Sloth", attack: 0, health: 100 })],
        registryWith(damageSelf)
      );

      expect(steps[1].defenderTeam[0].health).toBe(100);
    });
  });

  describe("Coconut perk — full damage block", () => {
    it("blocks one direct hit completely", () => {
      const attacker = pet({ type: "Sloth", attack: 30, health: 10 });
      const target = pet({ type: "Sloth", attack: 1, health: 10, perk: CoconutPerk });

      expect(dealDirectDamage(attacker, target)).toBe(0);
      expect(target.health).toBe(10);
      expect(target.perk).toBeNull();
    });

    it("blocks one ability hit completely", () => {
      const target = pet({ type: "Sloth", attack: 1, health: 10, perk: CoconutPerk });
      const actions = new BattleActions(battleContext(target, [target], []));

      expect(actions.dealAbilityDamage(target, 30)).toBe(0);
      expect(target.health).toBe(10);
      expect(target.perk).toBeNull();
    });
  });

  describe("Gorilla — hurt", () => {
    it.each([
      { level: 1, expectedActivationStep: 1 },
      { level: 2, expectedActivationStep: 3 },
      { level: 3, expectedActivationStep: 5 },
    ])(
      "gains Coconut up to $level times per battle",
      ({ level, expectedActivationStep }) => {
        const { steps } = simulateBattle(
          [pet({ type: "Gorilla", attack: 7, health: 10, level })],
          [pet({ type: "Sloth", attack: 1, health: 100 })],
          PET_REGISTRY
        );

        expect(steps[expectedActivationStep].attackerTeam[0].perk?.name).toBe(
          "Coconut"
        );
        expect(
          steps[expectedActivationStep + 2].attackerTeam[0].perk
        ).toBeNull();
      }
    );

    it("resolves both level 2 Elephant hits before Gorilla activates Hurt", () => {
      const { steps } = simulateBattle(
        [pet({ type: "Elephant", attack: 3, health: 7, level: 2 }), pet({ type: "Gorilla", attack: 7, health: 10, level: 2 })],
        [pet({ type: "Sloth", attack: 1, health: 100 })],
        PET_REGISTRY
      );

      expect(steps[1].attackerTeam[1]).toMatchObject({
        health: 8,
        perk: { name: "Coconut" },
      });
    });
  });

  describe("Seagull — friend summoned", () => {
    it("shares its shop use limit with battle summons", () => {
      const seagull = pet({ type: "Seagull", attack: 4, health: 3, perk: MelonPerk });
      const team = fireShopFriendSummoned(
        [pet({ type: "Cricket", attack: 2, health: 2 }), seagull, pet({ type: "Sloth", attack: 1, health: 10 })],
        2,
        PET_REGISTRY
      );

      expect(seagull.triggerCountsThisTurn).toEqual({
        [Trigger.friend_summoned]: 1,
      });

      const { steps } = simulateBattle(
        team,
        [pet({ type: "Sloth", attack: 100, health: 100 })],
        PET_REGISTRY
      );

      expect(steps[1].attackerTeam[0].type).toBe("Zombie Cricket");
      expect(steps[1].attackerTeam[0].perk).toBeNull();
    });
  });

  describe("Alpaca — friend summoned", () => {
    const summoner = (name: string, summons: number) =>
      abilityPet(name, {
        trigger: Trigger.start_of_battle,
        fn: (ctx) => {
          for (let i = 0; i < summons; i++) {
            new BattleActions(ctx).summon(pet({ type: "Sloth", attack: 1, health: 1 }), ctx.selfIndex);
          }
        },
      });

    it.each([
      { level: 1, expectedCount: 1 },
      { level: 2, expectedCount: 2 },
      { level: 3, expectedCount: 3 },
    ])(
      "grants 3 experience to up to $expectedCount friends in battle",
      ({ level, expectedCount }) => {
        const tripleSummoner = summoner("Alpaca Test Summoner", 3);
        const { steps } = simulateBattle(
          [pet({ type: tripleSummoner.name, attack: 100, health: 100 }), pet({ type: "Alpaca", attack: 3, health: 7, level })],
          [pet({ type: "Sloth", attack: 0, health: 1000 })],
          registryWith(tripleSummoner)
        );
        const summoned = steps[1].attackerTeam.filter(
          (friend) => friend.type === "Sloth"
        );

        expect(summoned.filter((friend) => friend.xp === 3)).toHaveLength(
          expectedCount
        );
        expect(summoned.filter((friend) => friend.xp === 0)).toHaveLength(
          3 - expectedCount
        );
      }
    );

    it("carries its shop trigger use into battle", () => {
      const shopTeam = fireShopFriendSummoned(
        [pet({ type: "Sloth", attack: 1, health: 1 }), pet({ type: "Alpaca", attack: 3, health: 7, level: 2 })],
        0,
        PET_REGISTRY
      );
      const alpaca = shopTeam[1] as PetInstance;
      const doubleSummoner = summoner("Alpaca Carryover Summoner", 2);
      const { steps } = simulateBattle(
        [pet({ type: doubleSummoner.name, attack: 100, health: 100 }), alpaca],
        [pet({ type: "Sloth", attack: 0, health: 1000 })],
        registryWith(doubleSummoner)
      );
      const summoned = steps[1].attackerTeam.filter(
        (friend) => friend.type === "Sloth"
      );

      expect(summoned.filter((friend) => friend.xp === 3)).toHaveLength(1);
      expect(summoned.filter((friend) => friend.xp === 0)).toHaveLength(1);
    });
  });

  describe("Spider — faint", () => {
    it.each([
      { level: 1, expected: "2/2" },
      { level: 2, expected: "4/4" },
      { level: 3, expected: "6/6" },
    ])(
      "summons a level $level tier 3 pet at $expected",
      ({ level }) => {
        const { steps } = simulateBattle(
          [pet({ type: "Spider", attack: 2, health: 2, level })],
          [pet({ type: "Sloth", attack: 3, health: 100 })],
          PET_REGISTRY
        );
        const summoned = steps[1].attackerTeam[0];

        expect(PET_REGISTRY[summoned.type]).toMatchObject({
          tier: 3,
          isToken: false,
        });
        expect(summoned).toMatchObject({
          attack: 2 * level,
          health: 2 * level,
          xp: getMinimumXpFor(level),
          level,
        });
      }
    );
  });

  describe("Rat — faint", () => {
    it.each([
      { level: 1, count: 1 },
      { level: 2, count: 2 },
      { level: 3, count: 3 },
    ])(
      "summons $count Dirty Rats at the front of the opposing team",
      ({ level, count }) => {
        const { steps } = simulateBattle(
          [pet({ type: "Rat", attack: 3, health: 1, level })],
          [pet({ type: "Horse", attack: 2, health: 10 })],
          PET_REGISTRY
        );

        const opposingTeam = steps[1].defenderTeam;
        expect(
          opposingTeam.slice(0, count).map((summon) => summon.type)
        ).toEqual(Array(count).fill("Dirty Rat"));
        expect(opposingTeam[count]).toMatchObject({ type: "Horse", attack: 2 });
      }
    );

    it("does not activate the opponent's friend-summoned abilities", () => {
      const { steps } = simulateBattle(
        [pet({ type: "Rat", attack: 3, health: 1, level: 3 })],
        [pet({ type: "Horse", attack: 2, health: 10 })],
        PET_REGISTRY
      );
      const dirtyRats = steps[1].defenderTeam.filter(
        (enemy) => enemy.type === "Dirty Rat"
      );

      expect(dirtyRats.map((rat) => rat.attack)).toEqual([1, 1, 1]);
    });
  });

  describe("Fly — friend faints", () => {
    it.each([
      { level: 1, stats: 4 },
      { level: 2, stats: 8 },
      { level: 3, stats: 12 },
    ])("summons a $stats/$stats Zombie Fly at level $level", ({ level, stats }) => {
      const { steps } = simulateBattle(
        [pet({ type: "Sloth", attack: 1, health: 1 }), pet({ type: "Fly", attack: 4, health: 4, level })],
        [pet({ type: "Sloth", attack: 10, health: 100 })],
        PET_REGISTRY
      );

      expect(steps[1].attackerTeam[0]).toMatchObject({
        type: "Zombie Fly",
        attack: stats,
        health: stats,
      });
    });

    it("waits until Rooster's Chick leaves room, then summons a Zombie Fly", () => {
      const { steps } = simulateBattle(
        [
          pet({ type: "Rooster", attack: 6, health: 1 }),
          pet({ type: "Fly", attack: 4, health: 4 }),
          pet({ type: "Sloth", attack: 1, health: 1 }),
          pet({ type: "Sloth", attack: 1, health: 1 }),
          pet({ type: "Sloth", attack: 1, health: 1 }),
        ],
        [pet({ type: "Sloth", attack: 10, health: 100 })],
        PET_REGISTRY
      );

      expect(
        steps[1].attackerTeam.some((friend) => friend.type === "Zombie Fly")
      ).toBe(false);
      expect(steps[1].attackerTeam[0].type).toBe("Chick");
      expect(
        steps[2].attackerTeam.filter((friend) => friend.type === "Zombie Fly")
      ).toHaveLength(1);
    });

    it("works at most three times", () => {
      const { steps } = simulateBattle(
        [
          pet({ type: "Sloth", attack: 1, health: 1 }),
          pet({ type: "Sloth", attack: 1, health: 1 }),
          pet({ type: "Sloth", attack: 1, health: 1 }),
          pet({ type: "Sloth", attack: 1, health: 1 }),
          pet({ type: "Fly", attack: 4, health: 100 }),
        ],
        [pet({ type: "Sloth", attack: 100, health: 1000 })],
        PET_REGISTRY
      );

      // One per fainted Sloth until the limit; a Zombie Fly fainting never
      // activates Fly, and the fourth Sloth gets none.
      expect(
        steps.filter((step) => step.attackerTeam[0]?.type === "Zombie Fly")
      ).toHaveLength(3);
    });

    it("only suppresses Fly when a Zombie Fly faints", () => {
      let listenerTriggers = 0;
      const listener = abilityPet("Faint Listener", {
        trigger: Trigger.friend_faints,
        fn: () => listenerTriggers++,
      });
      const { steps } = simulateBattle(
        [pet({ type: "Zombie Fly", attack: 4, health: 4 }), pet({ type: "Fly", attack: 4, health: 4 }), pet({ type: listener.name, attack: 1, health: 10 })],
        [pet({ type: "Sloth", attack: 4, health: 4 })],
        registryWith(listener)
      );

      expect(listenerTriggers).toBe(1);
      expect(
        steps[1].attackerTeam.some((friend) => friend.type === "Zombie Fly")
      ).toBe(false);
    });
  });

  describe("Chili perk — attack", () => {
    it("deals 5 ability damage to the second enemy during the attack", () => {
      const { steps } = simulateBattle(
        [pet({ type: "Sloth", attack: 1, health: 10, perk: ChiliPerk })],
        [pet({ type: "Sloth", attack: 1, health: 10 }), pet({ type: "Sloth", attack: 1, health: 10 })],
        PET_REGISTRY
      );

      expect(steps[1].defenderTeam[0].health).toBe(9);
      expect(steps[1].defenderTeam[1].health).toBe(5);
    });

    it("uses ability-damage defenses", () => {
      const { steps } = simulateBattle(
        [pet({ type: "Sloth", attack: 1, health: 10, perk: ChiliPerk })],
        [pet({ type: "Sloth", attack: 1, health: 10 }), pet({ type: "Sloth", attack: 1, health: 10, perk: GarlicPerk })],
        PET_REGISTRY
      );

      expect(steps[1].defenderTeam[1].health).toBe(7);
    });

    it("fires the second enemy's Hurt ability", () => {
      const hurtPet = abilityPet("Hurt Listener", {
        trigger: Trigger.hurt,
        fn: ({ self }) => {
          self.attack += 1;
        },
      });
      const { steps } = simulateBattle(
        [pet({ type: "Sloth", attack: 1, health: 10, perk: ChiliPerk })],
        [pet({ type: "Sloth", attack: 1, health: 10 }), pet({ type: "Hurt Listener", attack: 1, health: 10 })],
        registryWith(hurtPet)
      );

      expect(steps[1].defenderTeam[1].attack).toBe(2);
    });
  });

  describe("Deer — faint", () => {
    it.each([
      { level: 1, attack: 5, health: 3 },
      { level: 2, attack: 10, health: 6 },
      { level: 3, attack: 15, health: 9 },
    ])(
      "summons one $attack/$health Bus with Chili at level $level",
      ({ level, attack, health }) => {
        const { steps } = simulateBattle(
          [pet({ type: "Deer", attack: 2, health: 2, level }), pet({ type: "Rabbit", attack: 1, health: 2 })],
          [pet({ type: "Sloth", attack: 2, health: 100 }), pet({ type: "Sloth", attack: 0, health: 100 })],
          PET_REGISTRY
        );
        const bus = steps[1].attackerTeam.find(
          (friend) => friend.type === "Bus"
        );

        expect(
          steps[1].attackerTeam.filter((friend) => friend.type === "Bus")
        ).toHaveLength(1);
        expect(bus).toMatchObject({ attack, health, perk: { name: "Chili" } });
        expect(steps[2].defenderTeam[1].health).toBe(95);
      }
    );
  });

  describe("Health removal", () => {
    it("removes a flat amount, ignoring defensive perks", () => {
      const target = pet({ type: "Sloth", attack: 1, health: 10, perk: MelonPerk });

      expect(removeHealth(target, 3)).toBe(3);
      expect(target.health).toBe(7);
      expect(target.perk).toMatchObject({ name: "Melon", usesRemaining: 1 });
    });

    it("removes a percentage of current health, rounded up", () => {
      const target = pet({ type: "Sloth", attack: 1, health: 10 });

      expect(removePercentageHealth(target, 0.33)).toBe(4);
      expect(target.health).toBe(6);
    });

    it.each([
      { name: "flat", remove: (target: PetInstance) => removeHealth(target, 99) },
      {
        name: "percentage",
        remove: (target: PetInstance) => removePercentageHealth(target, 1),
      },
    ])("leaves at least 1 health on $name removal", ({ remove }) => {
      const target = pet({ type: "Sloth", attack: 1, health: 10 });

      expect(remove(target)).toBe(9);
      expect(target.health).toBe(1);
    });
  });

  describe("Garlic perk — damage reduction", () => {
    it("reduces incoming damage by 2", () => {
      const garlicSloth = pet({ type: "Sloth", attack: 1, health: 10, perk: GarlicPerk });
      const opposingSloth = pet({ type: "Sloth", attack: 5, health: 5 });
      const { steps } = simulateBattle([garlicSloth], [opposingSloth], PET_REGISTRY);
      expect(steps[1].attackerTeam[0].health).toBe(7); // 10 - (5-2)
    });

    it("does not increase damage for attackers with only 1 attack", () => {
      const garlicSloth = pet({ type: "Sloth", attack: 1, health: 10, perk: GarlicPerk });
      const { steps } = simulateBattle([garlicSloth], [pet({ type: "Sloth", attack: 1, health: 5 })], PET_REGISTRY);
      expect(steps[1].attackerTeam[0].health).toBe(9);
    });
  });

  describe("Melon perk — damage block", () => {
    it("blocks up to 20 damage on the first hit, then clears", () => {
      const melonSloth = pet({ type: "Sloth", attack: 1, health: 10, perk: MelonPerk });
      const { steps } = simulateBattle([melonSloth], [pet({ type: "Sloth", attack: 5, health: 100 })], PET_REGISTRY);
      expect(steps[1].attackerTeam[0].health).toBe(10);
      expect(steps[1].attackerTeam[0].perk).toBeNull();
    });

    it("blocks exactly 20 and lets the remainder through on a bigger hit", () => {
      const melonSloth = pet({ type: "Sloth", attack: 1, health: 10, perk: MelonPerk });
      const normalSloth = pet({ type: "Sloth", attack: 21, health: 100 });

      const { steps } = simulateBattle([melonSloth], [normalSloth], PET_REGISTRY);
      expect(steps[1].attackerTeam[0].health).toBe(9); // 10 - (21-20)
    });

    it("no longer blocks a second hit once used up", () => {
      const melonSloth = pet({ type: "Sloth", attack: 1, health: 30, perk: MelonPerk });

      const { steps } = simulateBattle([melonSloth], [pet({ type: "Sloth", attack: 5, health: 100 })], PET_REGISTRY);
      expect(steps[1].attackerTeam[0].health).toBe(30); // round 1: blocked
      expect(steps[2].attackerTeam[0].health).toBe(25); // round 2: perk gone, takes 5
    });
  });

  describe("Peanut + Melon interaction", () => {
    it("a fully-blocked hit does not count as a Peanut kill", () => {
      const scorpion = pet({ type: "Scorpion", attack: 1, health: 3, perk: PeanutPerk });
      const melonSloth: PetInstance = pet({ type: "Sloth", attack: 1, health: 10, perk: MelonPerk });

      const { steps } = simulateBattle([scorpion], [melonSloth], PET_REGISTRY);
      // Scorpion's 1 dmg is fully blocked (min(20,1)=1) — Sloth takes 0, so it
      // wasn't "hurt" and Peanut's instakill does not apply.
      expect(steps[1].defenderTeam[0].health).toBe(10);
    });
  });

  describe("Meat Bone", () => {
    it("increases base attack by +3", () => {
      const meatBoneSloth = pet({ type: "Sloth", attack: 1, health: 4, perk: MeatBonePerk });
      const opponent = pet({ type: "Sloth", attack: 2, health: 8 });

      const { result } = simulateBattle([meatBoneSloth], [opponent], PET_REGISTRY);
      expect(result).toBe("DRAW");
    });
  })

  describe("Steak", () => {
    it("increases base attack by +20", () => {
      const steakSloth = pet({ type: "Sloth", attack: 1, health: 21, perk: SteakPerk });
      const opponent = pet({ type: "Sloth", attack: 1, health: 21 });

      const { result } = simulateBattle([steakSloth], [opponent], PET_REGISTRY);
      expect(result).toBe("WIN");
    });

    it("is consumed after use", () => {
      const steakSloth = pet({ type: "Sloth", attack: 1, health: 21, perk: SteakPerk });
      const opponent = pet({ type: "Sloth", attack: 1, health: 22 });

      const { steps } = simulateBattle([steakSloth], [opponent], PET_REGISTRY);
      expect(steps[0].attackerTeam[0].perk?.name).toBe("Steak");
      expect(steps[1].attackerTeam[0].perk).toBe(null);
    });
  })

  describe("Mushroom", () => {
    it("summons the same pet as a 1/1", () => {
      const mushroomSloth = pet({ type: "Sloth", attack: 2, health: 2, perk: MushroomPerk });
      const opponent = pet({ type: "Sloth", attack: 2, health: 3 });
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
    const frontDodo = pet({ type: "Dodo", attack: 1, health: 5, level: 2 });
    const middleDodo = pet({ type: "Dodo", attack: 12, health: 5, level: 2 });
    const backDodo = pet({ type: "Dodo", attack: 8, health: 5, level: 2 });
    const { steps } = simulateBattle(
      [pet({ type: "Sloth", attack: 0, health: 100 }), frontDodo, middleDodo, backDodo],
      [pet({ type: "Sloth", attack: 0, health: 100 })],
      PET_REGISTRY
    );

    // Activation order should be INDEPENDENT of board order
    // Expected order:  middleDodo > backDodo > frontDodo
    // Order can be confirmed by Dodo attack scaling to give more or less based on activation order

    expect(petToString(steps[1].attackerTeam[0])).toBe("Sloth (13/100)");
    expect(petToString(steps[1].attackerTeam[1])).toBe("Dodo (13/5)");
    expect(petToString(steps[1].attackerTeam[2])).toBe("Dodo (20/5)");
    expect(petToString(steps[1].attackerTeam[3])).toBe("Dodo (8/5)");
  });

  it("Start of Battle dynamically updates based on attack order", () => {
    const frontDodo = pet({ type: "Dodo", attack: 8, health: 5, level: 2 });
    const middleDodo = pet({ type: "Dodo", attack: 4, health: 5, level: 2 });
    const backDodo = pet({ type: "Dodo", attack: 12, health: 5, level: 2 });

    const { steps } = simulateBattle(
      [pet({ type: "Sloth", attack: 0, health: 100 }), frontDodo, middleDodo, backDodo],
      [pet({ type: "Sloth", attack: 0, health: 100 })],
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

    expect(petToString(steps[1].attackerTeam[0])).toBe("Sloth (24/100)");
    expect(petToString(steps[1].attackerTeam[1])).toBe("Dodo (24/5)");
    expect(petToString(steps[1].attackerTeam[2])).toBe("Dodo (16/5)");
    expect(petToString(steps[1].attackerTeam[3])).toBe("Dodo (12/5)");
  });

  it("Faint ability fires even when pet dies during the Start of Battle phase", () => {
    const { steps } = simulateBattle(
      [pet({ type: "Sloth", attack: 1, health: 5 }), pet({ type: "Badger", attack: 6, health: 1 })],
      [pet({ type: "Dolphin", attack: 4, health: 3 })],
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
        [pet({ type: "Dolphin", attack: 4, health: 3 })],
        [pet({ type: "Mosquito", attack: 2, health: 2 }), pet({ type: "Sloth", attack: 1, health: 50 })],
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
        [pet({ type: "Elephant", attack: 3, health: 7 }), pet({ type: "Listener", attack: 1, health: 1 })],
        [pet({ type: "Sloth", attack: 1, health: 100 })],
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
        [pet({ type: "Sloth", attack: 1, health: 1 }), pet({ type: "Listener", attack: 1, health: 1 })],
        [pet({ type: "Sloth", attack: 5, health: 100 })],
        registryWith(listener)
      );

      expect(fired).toBe(1);
    });

    it("fires Knock out when its pet faints in the same hit", () => {
      const { steps } = simulateBattle(
        [pet({ type: "Rhino", attack: 6, health: 1 })],
        [pet({ type: "Sloth", attack: 1, health: 1 }), pet({ type: "Sloth", attack: 1, health: 50 })],
        PET_REGISTRY
      );

      expect(steps[1].attackerTeam).toHaveLength(0);
      expect(steps[1].defenderTeam[0].health).toBe(42);
    });
  });

  // TODO - Implement skipping friends that already have the perk
  it.skip("skips giving Melon to friends with Melon", () => {
    const turtle = pet({ type: "Turtle", attack: 2, health: 0 });
    const melonFriend = pet({ type: "Sloth", attack: 1, health: 5, perk: MelonPerk });
    const plainFriend = pet({ type: "Sloth", attack: 1, health: 5 });
    const ability = PET_REGISTRY.Turtle.abilities.get(Trigger.faint);
    if (!ability || ability.trigger !== Trigger.faint) throw new Error("Expected faint ability");

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
        [pet({ type: "Mosquito", attack: 2, health: 2 })],
        [pet({ type: "Hurt Listener", attack: 1, health: 10 })],
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
        [pet({ type: "Fainter", attack: 1, health: 1 }), pet({ type: "Listener", attack: 1, health: 10 })],
        [pet({ type: "Sloth", attack: 1, health: 100 })],
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
        [pet({ type: "Ant", attack: 1, health: 1 }), pet({ type: "Listener", attack: 1, health: 10 })],
        [pet({ type: "Sloth", attack: 1, health: 100 })],
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
        [pet({ type: "Sloth", attack: 1, health: 50 }), pet({ type: "Low", attack: 1, health: 50 })],
        [pet({ type: "Sloth", attack: 1, health: 50 }), pet({ type: "High", attack: 9, health: 50 })],
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
        [pet({ type: "After", attack: 1, health: 10 }), pet({ type: "Ahead", attack: 1, health: 10 })],
        [pet({ type: "Hurt", attack: 1, health: 10 })],
        registry
      );

      expect(order.slice(0, 3)).toEqual(["After", "Ahead", "Hurt"]);
    });
  });
});
