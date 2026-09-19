import { describe, it, expect } from "vitest";
import { PET_COST, getPetCost, getFoodCost, getSellValue } from "@/lib/game/costs";
import { Apple, BreadCrumbs, Pill } from "@/lib/foods";
import type { PetInstance, ShopFood, ShopPet } from "@/lib/types";

const shopPet = (extra: Partial<ShopPet> = {}): ShopPet => ({ type: "Ant", frozen: false, ...extra });
const shopFood = (type: string, extra: Partial<ShopFood> = {}): ShopFood => ({ type, frozen: false, ...extra });

describe("getPetCost", () => {
  it("is the base pet cost with no discount", () => {
    expect(getPetCost(shopPet())).toBe(PET_COST);
  });

  it("subtracts the item's discount", () => {
    expect(getPetCost(shopPet({ discount: 1 }))).toBe(PET_COST - 1);
  });

  it("never goes below 0", () => {
    expect(getPetCost(shopPet({ discount: 99 }))).toBe(0);
  });
});

describe("getFoodCost", () => {
  it("defaults to the pet cost, or the food's own cost when it sets one", () => {
    expect(getFoodCost(shopFood("Apple"), Apple)).toBe(PET_COST);
    expect(getFoodCost(shopFood("Pill"), Pill)).toBe(1);
    expect(getFoodCost(shopFood("Bread Crumbs"), BreadCrumbs)).toBe(0);
  });

  it("applies the item's discount to the food's own cost", () => {
    expect(getFoodCost(shopFood("Apple", { discount: 2 }), Apple)).toBe(PET_COST - 2);
    expect(getFoodCost(shopFood("Pill", { discount: 5 }), Pill)).toBe(0);
  });
});

describe("getSellValue", () => {
  it("is the pet's level", () => {
    const pet = (level: number): PetInstance => ({ type: "Ant", attack: 1, health: 1, perk: null, xp: 1, level });
    expect([1, 2, 3].map((l) => getSellValue(pet(l)))).toEqual([1, 2, 3]);
  });
});
