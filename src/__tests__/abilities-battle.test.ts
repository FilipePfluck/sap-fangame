import { describe, it, expect } from "vitest";
import { simulateBattle } from "@/lib/game/battle";
import { PET_REGISTRY } from "@/lib/pets";
import { petToString } from "@/lib/utils/flavor-text";
import { PetInstance } from "@/lib/types";
import { Trigger } from "@/lib/types";
import { grantExperience } from "@/lib/game/merge";
import { BattleActions } from "@/lib/game/ability-actions";
import {
  dealDirectDamage,
  removeHealth,
  removePercentageHealth,
} from "@/lib/utils/combat";
import { ChiliPerk } from "@/lib/perks/chili";
import { CoconutPerk } from "@/lib/perks/coconut";
import { GarlicPerk } from "@/lib/perks/garlic";
import { MelonPerk } from "@/lib/perks/melon";
import { PeanutPerk } from "@/lib/perks/peanut";
import { HoneyPerk } from "@/lib/perks/honey";
import { MeatBonePerk } from "@/lib/perks/meat-bone";
import { MushroomPerk } from "@/lib/perks/mushroom";
import { SteakPerk } from "@/lib/perks/steak";
import { staticPet, pet, registryWith, battleContext } from "./helpers";


describe("Pet Abilities", () => {
  describe("Ability-granted experience", () => {
    it("still grants stats at max XP without exceeding the cap", () => {
      const experienceGiver = staticPet("Experience Giver", {
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
      const summoner = staticPet("Summoner", {
        trigger: Trigger.start_of_battle,
        fn: (ctx) =>
          new BattleActions(ctx).summon(
            pet({ type: "Sloth", attack: 1, health: 1 }),
            ctx.selfIndex
          ),
      });
      const { steps } = simulateBattle(
        [
          pet({ type: summoner.name, attack: 1, health: 50 }),
          pet({ type: "Dog", attack: 3, health: 0 }),
        ],
        [pet({ type: "Sloth", attack: 1, health: 100 })],
        registryWith(summoner)
      );

      expect(
        steps[1].attackerTeam.some((friend) => friend.type === "Dog")
      ).toBe(false);
    });

    it("Mosquito only selects enemies with health remaining", () => {
      const deadEnemy = pet({ type: "Sloth", attack: 1, health: 0 });
      const livingEnemy = pet({ type: "Sloth", attack: 1, health: 10 });
      const mosquito = pet({ type: "Mosquito", attack: 2, health: 2 });
      const ability = PET_REGISTRY.Mosquito.abilities.get(
        Trigger.start_of_battle
      );
      if (!ability || ability.trigger !== Trigger.start_of_battle)
        throw new Error("Expected Mosquito start-of-battle ability");

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
      if (!ability || ability.trigger !== Trigger.after_attack)
        throw new Error("Expected Elephant after-attack ability");

      ability.fn(battleContext(elephant, team, []));

      expect(deadFriend.health).toBe(0);
      expect(livingFriend.health).toBe(9);
    });
  });

  describe("Health removal", () => {
    it("removes a flat amount, ignoring defensive perks", () => {
      const target = pet({
        type: "Sloth",
        attack: 1,
        health: 10,
        perk: MelonPerk,
      });

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
      {
        name: "flat",
        remove: (target: PetInstance) => removeHealth(target, 99),
      },
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
})

describe("Perks", () => {
  describe("Honey", () => {
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

  describe("Peanut", () => {
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

  describe("Coconut", () => {
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

  describe("Chili", () => {
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
      const hurtPet = staticPet("Hurt Listener", {
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

  describe("Garlic", () => {
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

  describe("Melon", () => {
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
      const listener = staticPet("Listener", {
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
      const listener = staticPet("Listener", {
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
      const listener = staticPet("Hurt Listener", {
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
      const fainter = staticPet("Fainter", { trigger: Trigger.faint, fn: () => order.push("Faint") });
      const listener = staticPet("Listener", {
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
      const listener = staticPet("Listener", {
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
        staticPet(name, {
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
      ) => staticPet(name, { trigger, fn: () => order.push(name) });
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
