import { describe, it, expect } from "vitest";
import { PET_REGISTRY } from "@/lib/pets";
import { staticPet, makeShop, pet, registryWith } from "@/__tests__/helpers";
import { fireBoardShopAbility } from "@/lib/game/shop-ability";
import { ApiBoard, Trigger } from "@/lib/types";
import { simulateBattle } from "@/lib/game/battle";
import { applyFoodEffect } from "@/lib/game/food";
import { Apple, Cupcake, Pill } from "@/lib/foods";
import { BattleActions } from "@/lib/game/ability-actions";
import { MelonPerk } from "@/lib/perks/melon";

describe("Rabbit", () => {
  it("gives the fed friend health, including when Rabbit eats", () => {
    const board: ApiBoard = [pet({ type: "Rabbit" }), pet({ type: "Ant" })];
    const fedAnt = applyFoodEffect(Apple, board, 1, PET_REGISTRY);
    const fedRabbit = applyFoodEffect(Apple, board, 0, PET_REGISTRY);

    expect(fedAnt[1]?.health).toBe(3);
    expect(fedRabbit[0]?.health).toBe(3);
  });

  it("triggers at most three times per turn and resets at turn start", () => {
    let board: ApiBoard = [pet({ type: "Rabbit" }), pet({ type: "Ant" })];
    for (let i = 0; i < 4; i++) {
      board = applyFoodEffect(Apple, board, 1, PET_REGISTRY);
    }
    expect(board[1]?.health).toBe(8);
    expect(board[0]?.triggerCountsThisTurn).toEqual({
      [Trigger.friend_ate_food]: 3,
    });

    const reset = fireBoardShopAbility(
      Trigger.start_of_turn,
      board,
      makeShop(),
      PET_REGISTRY
    ).board;
    const fedAfterReset = applyFoodEffect(Apple, reset, 1, PET_REGISTRY);
    expect(fedAfterReset[1]?.health).toBe(10);
  });

  it("keeps its permanent health bonus when Cupcake expires", () => {
    const board: ApiBoard = [pet({ type: "Rabbit" }), pet({ type: "Ant" })];
    const fed = applyFoodEffect(Cupcake, board, 1, PET_REGISTRY);
    const nextTurn = fireBoardShopAbility(
      Trigger.start_of_turn,
      fed,
      makeShop(),
      PET_REGISTRY
    ).board;

    expect(nextTurn[1]).toMatchObject({ attack: 1, health: 2 });
  });

  it("does not trigger from Pill because its target faints", () => {
    const board: ApiBoard = [pet({ type: "Rabbit" }), pet(), pet()];
    const result = applyFoodEffect(Pill, board, 1, PET_REGISTRY);

    expect(result[0]?.health).toBe(1);
    expect(result[0]?.triggerCountsThisTurn).toBeUndefined();
    expect(result[1]).toBeNull();

    const fedFish = applyFoodEffect(Apple, result, 2, PET_REGISTRY);
    expect(fedFish[2]?.health).toBe(3);
  });

  it("does not trigger while it is a pending faint", () => {
    const board: ApiBoard = [pet({ type: "Rabbit", health: 0 }), pet()];
    const result = applyFoodEffect(Apple, board, 1, PET_REGISTRY);

    expect(result[1]?.health).toBe(2);
    expect(result[0]?.triggerCountsThisTurn).toBeUndefined();
  });

  describe("in battle", () => {
    const tripleFeeder = staticPet("Triple Feeder", {
      trigger: Trigger.start_of_battle,
      fn: (ctx) => {
        for (let i = 0; i < 3; i++)
          new BattleActions(ctx).friendAteFood(ctx.team[1]);
      },
    });

    it("has only the triggers left over from the shop", () => {
      const { steps } = simulateBattle(
        [
          pet({ type: "Triple Feeder" }),
          pet({
            type: "Rabbit",
            triggerCountsThisTurn: { [Trigger.friend_ate_food]: 1 },
          }),
        ],
        [pet()],
        registryWith(tripleFeeder)
      );

      expect(steps[1].attackerTeam[0].health).toBe(3);
    });

    it("does not carry battle triggers back to the shop", () => {
      const rabbit = pet({
        type: "Rabbit",
        triggerCountsThisTurn: { [Trigger.friend_ate_food]: 1 },
      });
      simulateBattle(
        [pet({ type: "Triple Feeder" }), rabbit],
        [pet()],
        registryWith(tripleFeeder)
      );

      expect(rabbit.triggerCountsThisTurn?.[Trigger.friend_ate_food]).toBe(1);
    });

    it("triggers when a battle ability gives a friend a perk", () => {
      const perkGiver = staticPet("Perk Giver", {
        trigger: Trigger.start_of_battle,
        fn: (ctx) => {
          const friend = ctx.team[1];
          if (!friend) return;
          friend.perk = MelonPerk;
          new BattleActions(ctx).friendAteFood(friend);
        },
      });
      const { steps } = simulateBattle(
        [
          pet({ type: "Perk Giver" }),
          pet({ type: "Rabbit" }),
        ],
        [pet()],
        registryWith(perkGiver)
      );

      expect(steps[1].attackerTeam[0].health).toBe(2);
      expect(steps[1].attackerTeam[0].perk).toEqual(MelonPerk);
    });
  })
});
