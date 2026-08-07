import { describe, it, expect } from "vitest";
import { generateShop } from "@/lib/game/shop";
import { TURTLE_PACK_PETS } from "@/lib/pets";
import { TURTLE_PACK_FOODS } from "@/lib/foods";

describe("generateShop", () => {
  it("returns 3 pet slots and 1 food slot at turn 1", () => {
    const shop = generateShop({ turn: 1, pack: TURTLE_PACK_PETS, foodTypes: TURTLE_PACK_FOODS });
    expect(shop.shopPets).toHaveLength(3);
    expect(shop.shopFoods).toHaveLength(1);
  });

  it("returns 4 pet slots and 2 food slots at turn 5", () => {
    const shop = generateShop({ turn: 5, pack: TURTLE_PACK_PETS, foodTypes: TURTLE_PACK_FOODS });
    expect(shop.shopPets).toHaveLength(4);
    expect(shop.shopFoods).toHaveLength(2);
  });

  it("returns 5 pet slots at turn 9", () => {
    const shop = generateShop({ turn: 9, pack: TURTLE_PACK_PETS, foodTypes: TURTLE_PACK_FOODS });
    expect(shop.shopPets).toHaveLength(5);
  });

  it("all turn-1 pets are Sloth (only tier-1 pet)", () => {
    const shop = generateShop({ turn: 1, pack: TURTLE_PACK_PETS, foodTypes: TURTLE_PACK_FOODS });
    for (const pet of shop.shopPets) {
      expect(pet.type).toBe("Sloth");
      expect(pet.frozen).toBe(false);
    }
  });

  it("all turn-1 foods are Apple (only tier-1 food)", () => {
    const shop = generateShop({ turn: 1, pack: TURTLE_PACK_PETS, foodTypes: TURTLE_PACK_FOODS });
    expect(shop.shopFoods[0].type).toBe("Apple");
    expect(shop.shopFoods[0].frozen).toBe(false);
  });

  it("preserves frozen pets at the front", () => {
    const frozenPets = [{ type: "Sloth", frozen: true }];
    const shop = generateShop({
      turn: 1,
      pack: TURTLE_PACK_PETS,
      foodTypes: TURTLE_PACK_FOODS,
      frozenPets,
    });
    expect(shop.shopPets).toHaveLength(3);
    expect(shop.shopPets[0].frozen).toBe(true);
    expect(shop.shopPets[0].type).toBe("Sloth");
  });

  it("preserves frozen foods at the front", () => {
    const frozenFoods = [{ type: "Apple", frozen: true }];
    const shop = generateShop({
      turn: 1,
      pack: TURTLE_PACK_PETS,
      foodTypes: TURTLE_PACK_FOODS,
      frozenFoods,
    });
    expect(shop.shopFoods).toHaveLength(1);
    expect(shop.shopFoods[0].frozen).toBe(true);
    expect(shop.shopFoods[0].type).toBe("Apple");
  });
});
