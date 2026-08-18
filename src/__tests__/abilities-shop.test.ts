import { describe, it, expect } from "vitest";
import { fireShopAbility } from "@/lib/game/shop-ability";
import { PET_REGISTRY } from "@/lib/pets";
import { FOOD_REGISTRY } from "@/lib/foods";
import type { PetInstance, ShopState, Board } from "@/lib/types";

function makePet(type: string, level = 1): PetInstance {
  return { type, attack: 1, health: 1, perk: null, xp: level === 3 ? 6 : level === 2 ? 3 : 1, level };
}

function makeShop(petTypes: string[] = [], foodTypes: string[] = []): ShopState {
  return {
    shopPets: petTypes.map((t) => ({ type: t, frozen: false })),
    shopFoods: foodTypes.map((t) => ({ type: t, frozen: false })),
  };
}

function makeBoard(pets: (PetInstance | null)[]): Board {
  const board: Board = [null, null, null, null, null];
  pets.forEach((p, i) => { board[i] = p; });
  return board;
}

describe("Duck — sell", () => {
  it("increments tempHealthBonus on all current shop pets", () => {
    const duck = makePet("Duck");
    const shop = makeShop(["Sloth", "Ant"]);
    const board = makeBoard([null, null, null, null, null]);
    board[0] = duck;

    const { shop: result } = fireShopAbility("sell", duck, 0, board, shop, PET_REGISTRY, FOOD_REGISTRY);
    expect(result.shopPets[0].tempHealthBonus).toBe(1);
    expect(result.shopPets[1].tempHealthBonus).toBe(1);
  });

  it("stacks tempHealthBonus additively", () => {
    const duck = makePet("Duck");
    const shop: ShopState = {
      shopPets: [{ type: "Sloth", frozen: false, tempHealthBonus: 2 }],
      shopFoods: [],
    };
    const board = makeBoard([duck]);

    const { shop: result } = fireShopAbility("sell", duck, 0, board, shop, PET_REGISTRY, FOOD_REGISTRY);
    expect(result.shopPets[0].tempHealthBonus).toBe(3);
  });

  it("does not modify original shop", () => {
    const duck = makePet("Duck");
    const shop = makeShop(["Sloth"]);
    const board = makeBoard([duck]);

    fireShopAbility("sell", duck, 0, board, shop, PET_REGISTRY, FOOD_REGISTRY);
    expect(shop.shopPets[0].tempHealthBonus).toBeUndefined();
  });
});

describe("Beaver — sell", () => {
  it("gives +1 attack to 2 random friends", () => {
    const beaver = makePet("Beaver");
    const sloth1 = makePet("Sloth");
    const sloth2 = makePet("Sloth");
    const board = makeBoard([beaver, sloth1, sloth2]);

    const { board: result } = fireShopAbility("sell", beaver, 0, board, makeShop(), PET_REGISTRY, FOOD_REGISTRY);
    const friend1 = result[1] as PetInstance;
    const friend2 = result[2] as PetInstance;
    expect(friend1.attack).toBe(2); // +1
    expect(friend2.attack).toBe(2); // +1
  });

  it("buffs only available friend when only one exists", () => {
    const beaver = makePet("Beaver");
    const sloth = makePet("Sloth");
    const board = makeBoard([beaver, sloth]);

    const { board: result } = fireShopAbility("sell", beaver, 0, board, makeShop(), PET_REGISTRY, FOOD_REGISTRY);
    expect((result[1] as PetInstance).attack).toBe(2);
  });

  it("no-op when no friends on board", () => {
    const beaver = makePet("Beaver");
    const board = makeBoard([beaver]);

    const { board: result } = fireShopAbility("sell", beaver, 0, board, makeShop(), PET_REGISTRY, FOOD_REGISTRY);
    expect(result[0]).toEqual(beaver); // unchanged
  });
});

describe("Pigeon — sell", () => {
  it("level 1 adds 1 Bread Crumbs to shop", () => {
    const pigeon = makePet("Pigeon", 1);
    const board = makeBoard([pigeon]);
    const { shop } = fireShopAbility("sell", pigeon, 0, board, makeShop(), PET_REGISTRY, FOOD_REGISTRY);
    expect(shop.shopFoods).toHaveLength(1);
    expect(shop.shopFoods[0].type).toBe("Bread Crumbs");
    expect(shop.shopFoods[0].frozen).toBe(false);
  });

  it("level 2 adds 2 Bread Crumbs", () => {
    const pigeon = makePet("Pigeon", 2);
    const board = makeBoard([pigeon]);
    const { shop } = fireShopAbility("sell", pigeon, 0, board, makeShop(), PET_REGISTRY, FOOD_REGISTRY);
    expect(shop.shopFoods).toHaveLength(2);
    expect(shop.shopFoods.every((f) => f.type === "Bread Crumbs")).toBe(true);
  });

  it("level 3 adds 3 Bread Crumbs", () => {
    const pigeon = makePet("Pigeon", 3);
    const board = makeBoard([pigeon]);
    const { shop } = fireShopAbility("sell", pigeon, 0, board, makeShop(), PET_REGISTRY, FOOD_REGISTRY);
    expect(shop.shopFoods).toHaveLength(3);
  });
});

describe("Otter — buy", () => {
  it("gives +1 health to a random friend", () => {
    const sloth = makePet("Sloth");
    const otter = makePet("Otter");
    const board = makeBoard([sloth, otter]);

    const { board: result } = fireShopAbility("buy", otter, 1, board, makeShop(), PET_REGISTRY, FOOD_REGISTRY);
    expect((result[0] as PetInstance).health).toBe(2); // Sloth got +1 health
    expect((result[1] as PetInstance).health).toBe(1); // Otter unchanged
  });

  it("no-op when no friends on board", () => {
    const otter = makePet("Otter");
    const board = makeBoard([otter]);

    const { board: result } = fireShopAbility("buy", otter, 0, board, makeShop(), PET_REGISTRY, FOOD_REGISTRY);
    expect((result[0] as PetInstance).health).toBe(1); // Otter unchanged
  });
});

describe("Pig — sell", () => {
  it("level 1 gives +1 gold", () => {
    const pig = makePet("Pig", 1);
    const board = makeBoard([pig]);
    const { goldDelta } = fireShopAbility("sell", pig, 0, board, makeShop(), PET_REGISTRY, FOOD_REGISTRY);
    expect(goldDelta).toBe(1);
  });

  it("level 2 gives +2 gold", () => {
    const pig = makePet("Pig", 2);
    const board = makeBoard([pig]);
    const { goldDelta } = fireShopAbility("sell", pig, 0, board, makeShop(), PET_REGISTRY, FOOD_REGISTRY);
    expect(goldDelta).toBe(2);
  });

  it("level 3 gives +3 gold", () => {
    const pig = makePet("Pig", 3);
    const board = makeBoard([pig]);
    const { goldDelta } = fireShopAbility("sell", pig, 0, board, makeShop(), PET_REGISTRY, FOOD_REGISTRY);
    expect(goldDelta).toBe(3);
  });
});

describe("Fish — level-up", () => {
  it("level-up from lvl1 gives 2 friends +1/+1", () => {
    // Pass pet at OLD level (1) to simulate Fish leveling up from 1
    const fish = makePet("Fish", 1);
    const sloth1 = makePet("Sloth");
    const sloth2 = makePet("Sloth");
    const board = makeBoard([sloth1, fish, sloth2]);

    const { board: result } = fireShopAbility("level-up", fish, 1, board, makeShop(), PET_REGISTRY, FOOD_REGISTRY);
    expect((result[0] as PetInstance).attack).toBe(2);
    expect((result[0] as PetInstance).health).toBe(2);
    expect((result[2] as PetInstance).attack).toBe(2);
    expect((result[2] as PetInstance).health).toBe(2);
  });

  it("level-up from lvl2 gives 2 friends +2/+2", () => {
    const fish = makePet("Fish", 2);
    const sloth1 = makePet("Sloth");
    const sloth2 = makePet("Sloth");
    const board = makeBoard([sloth1, fish, sloth2]);

    const { board: result } = fireShopAbility("level-up", fish, 1, board, makeShop(), PET_REGISTRY, FOOD_REGISTRY);
    expect((result[0] as PetInstance).attack).toBe(3);
    expect((result[0] as PetInstance).health).toBe(3);
    expect((result[2] as PetInstance).attack).toBe(3);
    expect((result[2] as PetInstance).health).toBe(3);
  });

  it("no-op when no friends on board", () => {
    const fish = makePet("Fish", 1);
    const board = makeBoard([fish]);
    const { board: result } = fireShopAbility("level-up", fish, 0, board, makeShop(), PET_REGISTRY, FOOD_REGISTRY);
    expect(result[0]).toEqual(fish);
  });
});
