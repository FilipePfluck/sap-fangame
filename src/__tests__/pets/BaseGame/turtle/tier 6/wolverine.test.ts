import { describe, it, expect } from "vitest";
import { PET_REGISTRY } from "@/lib/pets";
import { staticPet, pet, registryWith } from "@/__tests__/helpers";
import { BattleActions } from "@/lib/game/ability-actions";
import { simulateBattle } from "@/lib/game/battle";
import { Trigger } from "@/lib/types";

describe("Wolverine", () => {
  const hurter = (hits: number) =>
    staticPet("Friend Hurter", {
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
        [
          pet({ attack: 0, health: 100 }),
          pet({ type: "Wolverine", attack: 5, health: 7, level }),
        ],
        [
          pet({  health: 100 }),
          pet({  health: 100 }),
        ],
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
          pet({ type: "Target",  health: 100 }),
          pet({ type: "Wolverine", attack: 5, health: 7 }),
        ],
        [pet({ attack: 0, health: 100 })],
        registryWith(damageFriend)
      );

      expect(steps[0].defenderTeam[0].health).toBe(100);
      expect(steps[1].defenderTeam[0].health).toBe(health);
    }
  );

  it("only increments when other friends are hurt", () => {
    const damageSelf = staticPet("Self Hurter", {
      trigger: Trigger.start_of_battle,
      fn: (ctx) => {
        for (let i = 0; i < 4; i++) {
          new BattleActions(ctx).dealAbilityDamage(ctx.team[1], 1);
        }
      },
    });
    const { steps } = simulateBattle(
      [
        pet({ type: damageSelf.name, attack: 0, health: 100 }),
        pet({ type: "Wolverine", attack: 5, health: 7 }),
      ],
      [pet({ attack: 0, health: 100 })],
      registryWith(damageSelf)
    );

    expect(steps[1].defenderTeam[0].health).toBe(100);
  });
});
