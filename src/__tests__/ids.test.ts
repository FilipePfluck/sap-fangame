import { describe, it, expect } from "vitest";
import { PET_BY_ID, PET_REGISTRY } from "@/lib/pets";
import { FOOD_BY_ID, FOOD_REGISTRY } from "@/lib/foods";

const pets = Object.values(PET_REGISTRY);
const foods = Object.values(FOOD_REGISTRY);

// Pack spec: each pet and food has a unique ID within its own type.
describe("ids", () => {
  it.each([...pets, ...foods])("$name has a positive integer ID", ({ id }) => {
    expect(Number.isInteger(id) && id > 0).toBe(true);
  });

  it("gives every pet its own ID", () => {
    expect(new Set(pets.map((pet) => pet.id)).size).toBe(pets.length);
  });

  it("gives every food its own ID", () => {
    expect(new Set(foods.map((food) => food.id)).size).toBe(foods.length);
  });

  it("looks pets and foods up by ID", () => {
    expect(PET_BY_ID[1].name).toBe("Ant");
    expect(FOOD_BY_ID[1].name).toBe("Apple");
  });
});
