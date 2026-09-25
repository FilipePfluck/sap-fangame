import { describe, it, expect } from "vitest";
import { applyFoodEffect, feedError, needsTarget } from "@/lib/game/food";
import { PET_REGISTRY } from "@/lib/pets";
import { Apple, Honey, Pill, Sushi } from "@/lib/foods";
import { Chocolate } from "@/lib/foods/chocolate";
import { Cupcake } from "@/lib/foods/cupcake";
import type { Board, FoodType, PetInstance, PetType } from "@/lib/types";
import { MeatBone } from "@/lib/foods/meat-bone";
import { MeatBonePerk } from "@/lib/perks/meat-bone";
import { HoneyPerk } from "@/lib/perks/honey";
import { fireBoardShopAbility } from "@/lib/game/shop-ability";
import { Trigger } from "@/lib/types";

function pet(type: string, attack = 2, health = 2): PetInstance {
  return { type, attack, health, perk: null, xp: 0, level: 1 };
}

describe("applyFoodEffect", () => {
  it("applies the attack/health bonus to the targeted pet for standard foods", () => {
    const board: Board = [pet("Ant"), pet("Fish"), null, null, null];
    const result = applyFoodEffect(Apple, board, 1, PET_REGISTRY);
    expect(result[1]).toMatchObject({ attack: 3, health: 3 });
    expect(result[0]).toMatchObject({ attack: 2, health: 2 });
  });

  it("sets the perk for perk foods", () => {
    const board: Board = [pet("Ant"), null, null, null, null];
    const result = applyFoodEffect(Honey, board, 0, PET_REGISTRY);
    expect(result[0]?.perk).toBe(HoneyPerk);
  });

  it("does not mutate the input board for standard foods", () => {
    const board: Board = [pet("Ant"), null, null, null, null];
    applyFoodEffect(Apple, board, 0, PET_REGISTRY);
    expect(board[0]).toMatchObject({ attack: 2, health: 2 });
  });

  it("removes Cupcake's temporary stats at the start of next turn", () => {
    const board: Board = [pet("Ant", 2, 2)];
    const fed = applyFoodEffect(Cupcake, board, 0, PET_REGISTRY);
    expect(fed[0]).toMatchObject({
      attack: 5,
      health: 5,
      tempAttack: 3,
      tempHealth: 3,
    });

    const nextTurn = fireBoardShopAbility(
      Trigger.start_of_turn,
      fed,
      { shopPets: [], shopFoods: [] },
      PET_REGISTRY
    ).board;

    expect(nextTurn[0]).toMatchObject({ attack: 2, health: 2 });
    expect(nextTurn[0]?.tempAttack).toBeUndefined();
    expect(nextTurn[0]?.tempHealth).toBeUndefined();
  });

  it("keeps Rabbit's permanent health bonus when Cupcake expires", () => {
    const board: Board = [pet("Rabbit"), pet("Ant")];
    const fed = applyFoodEffect(Cupcake, board, 1, PET_REGISTRY);
    const nextTurn = fireBoardShopAbility(
      Trigger.start_of_turn,
      fed,
      { shopPets: [], shopFoods: [] },
      PET_REGISTRY
    ).board;

    expect(nextTurn[1]).toMatchObject({ attack: 2, health: 3 });
  });

  it("Rabbit gives the fed friend health, including when Rabbit eats", () => {
    const board: Board = [pet("Rabbit"), pet("Ant")];
    const fedAnt = applyFoodEffect(Apple, board, 1, PET_REGISTRY);
    const fedRabbit = applyFoodEffect(Apple, board, 0, PET_REGISTRY);

    expect(fedAnt[1]?.health).toBe(4);
    expect(fedRabbit[0]?.health).toBe(4);
  });

  it("Rabbit triggers at most three times per turn and resets at turn start", () => {
    let board: Board = [pet("Rabbit"), pet("Ant")];
    for (let i = 0; i < 4; i++) {
      board = applyFoodEffect(Apple, board, 1, PET_REGISTRY);
    }
    expect(board[1]?.health).toBe(9);

    const reset = fireBoardShopAbility(
      Trigger.start_of_turn,
      board,
      { shopPets: [], shopFoods: [] },
      PET_REGISTRY
    ).board;
    const fedAfterReset = applyFoodEffect(Apple, reset, 1, PET_REGISTRY);
    expect(fedAfterReset[1]?.health).toBe(11);
  });

  it("Pill does not trigger Rabbit because its target faints", () => {
    const board: Board = [pet("Rabbit"), pet("Sloth"), pet("Fish")];
    const result = applyFoodEffect(Pill, board, 1, PET_REGISTRY);

    expect(result[0]?.health).toBe(2);
    expect(result[0]?.foodTriggersThisTurn).toBeUndefined();
    expect(result[1]).toBeNull();

    const fedSloth = applyFoodEffect(Apple, result, 2, PET_REGISTRY);
    expect(fedSloth[2]?.health).toBe(4);
  });

  it("Chocolate grants XP and matching attack/health, updating pet level", () => {
    const board: Board = [pet("Ant", 2, 2)];
    const result = applyFoodEffect(Chocolate, board, 0, PET_REGISTRY);

    expect(result[0]).toMatchObject({
      attack: 3,
      health: 3,
      xp: 1,
      level: 1,
    });
  });

  it("Seal buffs friends only when Seal eats food", () => {
    const board: Board = [pet("Seal"), pet("Ant"), pet("Fish")];
    const sealEats = applyFoodEffect(Apple, board, 0, PET_REGISTRY);
    const friendEats = applyFoodEffect(
      Apple,
      [pet("Seal"), pet("Ant"), pet("Fish")],
      1,
      PET_REGISTRY
    );

    expect(sealEats[1]?.attack).toBe(3);
    expect(sealEats[2]?.attack).toBe(3);
    expect(friendEats[2]?.attack).toBe(2);
  });

  it("fires food-eaten abilities by attack", () => {
    const order: string[] = [];
    const listener = (name: string): PetType => ({
      name,
      sprite: "/sap/sloth.webp",
      tier: 1,
      baseAttack: 1,
      baseHealth: 1,
      isToken: false,
      ability: {
        trigger: Trigger.friend_ate_food,
        fn: ({ self }) => order.push(self.type),
      },
      description: "",
    });
    const low = listener("Low");
    const high = listener("High");
    const registry = { ...PET_REGISTRY, Low: low, High: high };
    const board = [
      { ...pet("Low"), attack: 1 },
      { ...pet("High"), attack: 9 },
      pet("Sloth"),
    ];

    applyFoodEffect(Apple, board, 2, registry);

    expect(order).toEqual(["High", "Low"]);
  });

  it("does not trigger food abilities on a pending-faint friend", () => {
    const board: Board = [{ ...pet("Rabbit"), health: 0 }, pet("Sloth")];
    const result = applyFoodEffect(Apple, board, 1, PET_REGISTRY);

    expect(result[1]?.health).toBe(3);
    expect(result[0]?.foodTriggersThisTurn).toBeUndefined();
  });

  it("Chocolate can advance a pet to level 2 or 3", () => {
    const levelTwo = applyFoodEffect(
      Chocolate,
      [{ ...pet("Ant", 2, 2), xp: 1 }],
      0,
      PET_REGISTRY
    );
    const levelThree = applyFoodEffect(
      Chocolate,
      [{ ...pet("Ant", 2, 2), xp: 4, level: 2 }],
      0,
      PET_REGISTRY
    );

    expect(levelTwo[0]).toMatchObject({ xp: 2, level: 2, attack: 3, health: 3 });
    expect(levelThree[0]).toMatchObject({ xp: 5, level: 3, attack: 3, health: 3 });
  });

  it("does not apply Chocolate to a pet at the XP cap", () => {
    const board: Board = [{ ...pet("Ant", 2, 2), xp: 5, level: 3 }];

    expect(feedError(Chocolate, board, 0)).toBe("Pet has reached max experience");
    expect(applyFoodEffect(Chocolate, board, 0, PET_REGISTRY)[0]).toEqual(board[0]);
  });

  it("uses the food's own applyEffect when present (Pill removes the pet)", () => {
    const board: Board = [pet("Ant"), pet("Fish"), null, null, null];
    const result = applyFoodEffect(Pill, board, 0, PET_REGISTRY);
    expect(result[0]).toBeNull();
    expect(result[1]).not.toBeNull();
  });

  it("Sushi buffs three random pets, wherever boardPosition points", () => {
    const board: Board = [pet("Ant"), pet("Fish"), pet("Pig"), pet("Cricket"), null];
    const result = applyFoodEffect(Sushi, board, 4, PET_REGISTRY);
    const buffed = result.filter((p) => p && p.attack === 3 && p.health === 3);
    expect(buffed).toHaveLength(3);
    expect(result[4]).toBeNull();
  });

  it("random-target foods buff every pet when fewer than asked for are on the board", () => {
    const board: Board = [pet("Ant"), null, pet("Fish"), null, null];
    const result = applyFoodEffect(Sushi, board, 0, PET_REGISTRY);
    expect(result.filter((p) => p && p.attack === 3)).toHaveLength(2);
  });

  it("random-target foods also apply perks to each target", () => {
    const perkFood: FoodType = { ...MeatBone, targeting: { random: 2 } };
    const board: Board = [pet("Ant"), pet("Fish"), pet("Pig"), null, null];
    const result = applyFoodEffect(perkFood, board, 0, PET_REGISTRY);
    expect(result.filter((p) => p?.perk === MeatBonePerk)).toHaveLength(2);
  });

  it("leaves the input board's pets untouched for random-target foods", () => {
    const board: Board = [pet("Ant"), pet("Fish"), pet("Pig"), null, null];
    applyFoodEffect(Sushi, board, 0, PET_REGISTRY);
    expect(board.every((p) => !p || (p.attack === 2 && p.health === 2))).toBe(true);
  });

  it("does not mutate the input board's pets for Pill either", () => {
    const board: Board = [pet("Ant"), pet("Fish"), null, null, null];
    applyFoodEffect(Pill, board, 0, PET_REGISTRY);
    expect(board.every((p) => !p || (p.attack === 2 && p.health === 2))).toBe(true);
  });
});

describe("needsTarget", () => {
  it("is true for chosen-target foods and false for random-target ones", () => {
    expect(needsTarget(Apple)).toBe(true);
    expect(needsTarget(Pill)).toBe(true);
    expect(needsTarget(Sushi)).toBe(false);
  });
});

describe("feedError", () => {
  const board: Board = [pet("Ant"), null, null, null, null];
  const empty: Board = [null, null, null, null, null];

  it("requires an occupied chosen slot for chosen-target foods", () => {
    expect(feedError(Apple, board, 0)).toBeNull();
    expect(feedError(Apple, board, 1)).toBe("Select a pet to feed");
    expect(feedError(Apple, board, undefined)).toBe("Select a pet to feed");
  });

  it("only requires some pet on the board for random-target foods", () => {
    expect(feedError(Sushi, board, undefined)).toBeNull();
    expect(feedError(Sushi, empty, undefined)).toBe("No pets to feed");
  });
});
