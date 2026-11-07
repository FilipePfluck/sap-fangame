import { describe, it, expect } from "vitest";
import { simulateBattle } from "@/lib/game/battle";
import { pet, registryWith, staticPet } from "@/__tests__/helpers";
import { PET_REGISTRY } from "@/lib/pets";
import { Trigger } from "@/lib/types";
import { BattleActions } from "@/lib/game/ability-actions";

describe("Tiger", () => {
  it("repeats a friend's Faint ability before that friend is removed", () => {
    const { steps } = simulateBattle(
      [
        pet({ type: "Ant",  health: 1 }),
        pet({ type: "Tiger", attack: 6, health: 4, level: 1 }),
      ],
      [pet({  health: 100 })],
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
      const damageFriend = staticPet("Friend Hurter", {
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
          pet({ type: "Target",  health: 100 }),
          pet({ type: "Wolverine", attack: 5, health: 7, level: 2 }),
          pet({ type: "Tiger",  health: 50, level: tigerLevel }),
        ],
        [pet({ attack: 0, health: 100 })],
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
          pet({  health: 5 }),
          pet({ type: "Dodo", attack: 4, health: 2 }),
          pet({ type: "Tiger", attack: 6, health: 4, level }),
        ],
        [pet({  health: 50 })],
        PET_REGISTRY
      );

      expect(steps[1].description).toContain(result);
    }
  );
});

