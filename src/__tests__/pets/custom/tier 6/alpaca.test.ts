import { describe, it, expect } from "vitest";
import { pet, registryWith, staticPet } from "@/__tests__/helpers";
import { type PetInstance, Trigger } from "@/lib/types";
import { BattleActions } from "@/lib/game/ability-actions";
import { simulateBattle } from "@/lib/game/battle";
import { fireShopFriendSummoned } from "@/lib/game/shop-ability";
import { PET_REGISTRY } from "@/lib/pets";

describe("Alpaca", () => {
  const summoner = (name: string, summons: number) =>
    staticPet(name, {
      trigger: Trigger.start_of_battle,
      fn: (ctx) => {
        for (let i = 0; i < summons; i++) {
          new BattleActions(ctx).summon(
            pet(),
            ctx.selfIndex
          );
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
        [
          pet({ type: tripleSummoner.name, attack: 100, health: 100 }),
          pet({ type: "Alpaca", attack: 3, health: 7, level }),
        ],
        [pet({ attack: 0, health: 1000 })],
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
      [
        pet(),
        pet({ type: "Alpaca", attack: 3, health: 7, level: 2 }),
      ],
      0,
      PET_REGISTRY
    );
    const alpaca = shopTeam[1] as PetInstance;
    const doubleSummoner = summoner("Alpaca Carryover Summoner", 2);
    const { steps } = simulateBattle(
      [pet({ type: doubleSummoner.name, attack: 100, health: 100 }), alpaca],
      [pet({ attack: 0, health: 1000 })],
      registryWith(doubleSummoner)
    );
    const summoned = steps[1].attackerTeam.filter(
      (friend) => friend.type === "Sloth"
    );

    expect(summoned.filter((friend) => friend.xp === 3)).toHaveLength(1);
    expect(summoned.filter((friend) => friend.xp === 0)).toHaveLength(1);
  });
});
