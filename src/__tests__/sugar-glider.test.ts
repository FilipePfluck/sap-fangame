import { describe, it, expect } from "vitest";
import { applyFoodEffect } from "@/lib/game/food";
import { fireBoardShopAbility } from "@/lib/game/shop-ability";
import { getFoodCost } from "@/lib/game/costs";
import { PET_REGISTRY } from "@/lib/pets";
import { Cupcake } from "@/lib/foods/cupcake";
import { ApiBoard, PetInstance, Trigger } from "@/lib/types";

function pet(type: string, attack = 2, health = 2, level = 1): PetInstance {
  return { type, attack, health, perk: null, xp: 0, level };
}

describe("Sugar Glider", () => {
  it("stocks a free Cupcake with its level as the multiplier", () => {
    const board: ApiBoard = [pet("Sugar Glider", 1, 3, 2)];
    const { shop } = fireBoardShopAbility(
      Trigger.start_of_turn,
      board,
      { shopPets: [], shopFoods: [] },
      PET_REGISTRY
    );
    expect(shop.shopFoods).toEqual([
      expect.objectContaining({ type: "Cupcake", multiplier: 2 }),
    ]);
    expect(getFoodCost(shop.shopFoods[0], Cupcake)).toBe(0);
  });

  it("multiplies the Cupcake's temporary stats", () => {
    const board: ApiBoard = [pet("Ant")];
    const result = applyFoodEffect(Cupcake, board, 0, PET_REGISTRY, 3);
    expect(result[0]).toMatchObject({
      attack: 11,
      health: 11,
      tempAttack: 9,
      tempHealth: 9,
    });
  });

  it("adds Cat's level to the food's multiplier", () => {
    // Level 2 Cupcake (2x) + level 1 Cat (+1) = 3x.
    const board: ApiBoard = [pet("Ant"), pet("Cat", 4, 5)];
    const result = applyFoodEffect(Cupcake, board, 0, PET_REGISTRY, 2);
    expect(result[0]).toMatchObject({ attack: 11, health: 11 });
  });
});
