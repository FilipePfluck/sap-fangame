import { describe, it, expect } from "vitest";
import {
  fireShopAbility,
  fireBoardShopAbility,
  fireShopFaint,
  fireShopFriendSummoned,
} from "@/lib/game/shop-ability";
import { PET_REGISTRY } from "@/lib/pets";
import { FOOD_REGISTRY } from "@/lib/foods";
import { getFoodCost } from "@/lib/game/costs";
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

    const { shop: result } = fireShopAbility("sell", duck, 0, board, shop, PET_REGISTRY);
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

    const { shop: result } = fireShopAbility("sell", duck, 0, board, shop, PET_REGISTRY);
    expect(result.shopPets[0].tempHealthBonus).toBe(3);
  });

  it("does not modify original shop", () => {
    const duck = makePet("Duck");
    const shop = makeShop(["Sloth"]);
    const board = makeBoard([duck]);

    fireShopAbility("sell", duck, 0, board, shop, PET_REGISTRY);
    expect(shop.shopPets[0].tempHealthBonus).toBeUndefined();
  });
});

describe("Beaver — sell", () => {
  it("gives +1 attack to 2 random friends", () => {
    const beaver = makePet("Beaver");
    const sloth1 = makePet("Sloth");
    const sloth2 = makePet("Sloth");
    const board = makeBoard([beaver, sloth1, sloth2]);

    const { board: result } = fireShopAbility("sell", beaver, 0, board, makeShop(), PET_REGISTRY);
    const friend1 = result[1] as PetInstance;
    const friend2 = result[2] as PetInstance;
    expect(friend1.attack).toBe(2); // +1
    expect(friend2.attack).toBe(2); // +1
  });

  it("buffs only available friend when only one exists", () => {
    const beaver = makePet("Beaver");
    const sloth = makePet("Sloth");
    const board = makeBoard([beaver, sloth]);

    const { board: result } = fireShopAbility("sell", beaver, 0, board, makeShop(), PET_REGISTRY);
    expect((result[1] as PetInstance).attack).toBe(2);
  });

  it("no-op when no friends on board", () => {
    const beaver = makePet("Beaver");
    const board = makeBoard([beaver]);

    const { board: result } = fireShopAbility("sell", beaver, 0, board, makeShop(), PET_REGISTRY);
    expect(result[0]).toEqual(beaver); // unchanged
  });
});

describe("Pigeon — sell", () => {
  it("level 1 adds 1 Bread Crumbs to shop", () => {
    const pigeon = makePet("Pigeon", 1);
    const board = makeBoard([pigeon]);
    const { shop } = fireShopAbility("sell", pigeon, 0, board, makeShop(), PET_REGISTRY);
    expect(shop.shopFoods).toHaveLength(1);
    expect(shop.shopFoods[0].type).toBe("Bread Crumbs");
    expect(shop.shopFoods[0].frozen).toBe(false);
  });

  it("level 2 adds 2 Bread Crumbs", () => {
    const pigeon = makePet("Pigeon", 2);
    const board = makeBoard([pigeon]);
    const { shop } = fireShopAbility("sell", pigeon, 0, board, makeShop(), PET_REGISTRY);
    expect(shop.shopFoods).toHaveLength(2);
    expect(shop.shopFoods.every((f) => f.type === "Bread Crumbs")).toBe(true);
  });

  it("level 3 adds 3 Bread Crumbs", () => {
    const pigeon = makePet("Pigeon", 3);
    const board = makeBoard([pigeon]);
    const { shop } = fireShopAbility("sell", pigeon, 0, board, makeShop(), PET_REGISTRY);
    expect(shop.shopFoods).toHaveLength(3);
  });
});

describe("Otter — buy", () => {
  it("gives +1 health to a random friend", () => {
    const sloth = makePet("Sloth");
    const otter = makePet("Otter");
    const board = makeBoard([sloth, otter]);

    const { board: result } = fireShopAbility("buy", otter, 1, board, makeShop(), PET_REGISTRY);
    expect((result[0] as PetInstance).health).toBe(2); // Sloth got +1 health
    expect((result[1] as PetInstance).health).toBe(1); // Otter unchanged
  });

  it("no-op when no friends on board", () => {
    const otter = makePet("Otter");
    const board = makeBoard([otter]);

    const { board: result } = fireShopAbility("buy", otter, 0, board, makeShop(), PET_REGISTRY);
    expect((result[0] as PetInstance).health).toBe(1); // Otter unchanged
  });
});

describe("Shop capacity — stocking into a full shop evicts unfrozen items", () => {
  const petsNamed = (names: string[]) => names.map((type) => ({ type, frozen: false }));

  it("stocking food deletes pets from the rightmost pet, keeping existing foods", () => {
    // 8 pets + 1 food = 9. Level-3 Pigeon stocks 3 Bread Crumbs: the first
    // fits, the next two each delete the rightmost pet.
    const pigeon = makePet("Pigeon", 3);
    const shop: ShopState = {
      shopPets: petsNamed(["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8"]),
      shopFoods: [{ type: "Garlic", frozen: false }],
    };
    const { shop: result } = fireShopAbility("sell", pigeon, 0, makeBoard([pigeon]), shop, PET_REGISTRY);
    expect(result.shopPets.map((p) => p.type)).toEqual(["P1", "P2", "P3", "P4", "P5", "P6"]);
    expect(result.shopFoods.map((f) => f.type)).toEqual(["Garlic", "Bread Crumbs", "Bread Crumbs", "Bread Crumbs"]);
  });

  it("deletes the rightmost pet to stock food into a completely full shop", () => {
    const pigeon = makePet("Pigeon", 1);
    const shop: ShopState = {
      shopPets: petsNamed(["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8", "P9", "P10"]),
      shopFoods: [],
    };
    const { shop: result } = fireShopAbility("sell", pigeon, 0, makeBoard([pigeon]), shop, PET_REGISTRY);
    expect(result.shopPets.map((p) => p.type)).not.toContain("P10");
    expect(result.shopPets).toHaveLength(9);
    expect(result.shopFoods).toHaveLength(1);
  });

  it("frozen pets are never deleted and win over new food", () => {
    const pigeon = makePet("Pigeon", 1);
    const shop: ShopState = {
      shopPets: Array(10).fill(null).map(() => ({ type: "Sloth", frozen: true })),
      shopFoods: [],
    };
    const { shop: result } = fireShopAbility("sell", pigeon, 0, makeBoard([pigeon]), shop, PET_REGISTRY);
    expect(result.shopPets).toHaveLength(10);
    expect(result.shopFoods).toHaveLength(0);
  });

  it("skips frozen pets and deletes the rightmost unfrozen one", () => {
    const pigeon = makePet("Pigeon", 1);
    const shop: ShopState = {
      shopPets: [
        { type: "Ant", frozen: false },
        { type: "Duck", frozen: false },
        ...Array(8).fill(null).map(() => ({ type: "Sloth", frozen: true })),
      ],
      shopFoods: [],
    };
    const { shop: result } = fireShopAbility("sell", pigeon, 0, makeBoard([pigeon]), shop, PET_REGISTRY);
    expect(result.shopPets.map((p) => p.type)).not.toContain("Duck");
    expect(result.shopPets.map((p) => p.type)).toContain("Ant");
    expect(result.shopFoods).toHaveLength(1);
  });

  it("frozen pets block stocking even when unfrozen foods exist", () => {
    const pigeon = makePet("Pigeon", 1);
    const shop: ShopState = {
      shopPets: Array(8).fill(null).map(() => ({ type: "Sloth", frozen: true })),
      shopFoods: [{ type: "Apple", frozen: false }, { type: "Honey", frozen: false }],
    };
    const { shop: result } = fireShopAbility("sell", pigeon, 0, makeBoard([pigeon]), shop, PET_REGISTRY);
    // falls back to the oldest food so the new one still fits
    expect(result.shopFoods.map((f) => f.type)).toEqual(["Honey", "Bread Crumbs"]);
    expect(result.shopPets).toHaveLength(8);
  });
});

describe("Pig — sell", () => {
  it("level 1 gives +1 gold", () => {
    const pig = makePet("Pig", 1);
    const board = makeBoard([pig]);
    const { goldDelta } = fireShopAbility("sell", pig, 0, board, makeShop(), PET_REGISTRY);
    expect(goldDelta).toBe(1);
  });

  it("level 2 gives +2 gold", () => {
    const pig = makePet("Pig", 2);
    const board = makeBoard([pig]);
    const { goldDelta } = fireShopAbility("sell", pig, 0, board, makeShop(), PET_REGISTRY);
    expect(goldDelta).toBe(2);
  });

  it("level 3 gives +3 gold", () => {
    const pig = makePet("Pig", 3);
    const board = makeBoard([pig]);
    const { goldDelta } = fireShopAbility("sell", pig, 0, board, makeShop(), PET_REGISTRY);
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

    const { board: result } = fireShopAbility("level-up", fish, 1, board, makeShop(), PET_REGISTRY);
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

    const { board: result } = fireShopAbility("level-up", fish, 1, board, makeShop(), PET_REGISTRY);
    expect((result[0] as PetInstance).attack).toBe(3);
    expect((result[0] as PetInstance).health).toBe(3);
    expect((result[2] as PetInstance).attack).toBe(3);
    expect((result[2] as PetInstance).health).toBe(3);
  });

  it("no-op when no friends on board", () => {
    const fish = makePet("Fish", 1);
    const board = makeBoard([fish]);
    const { board: result } = fireShopAbility("level-up", fish, 0, board, makeShop(), PET_REGISTRY);
    expect(result[0]).toEqual(fish);
  });
});

describe("Swan — start-of-turn", () => {
  it("gives +1 gold", () => {
    const swan = makePet("Swan");
    const board = makeBoard([swan]);
    const { goldDelta } = fireBoardShopAbility("start-of-turn", board, makeShop(), PET_REGISTRY);
    expect(goldDelta).toBe(1);
  });
});

describe("Squirrel — start-of-turn", () => {
  it("discounts every shop food by 1 gold and leaves pets alone", () => {
    const board = makeBoard([makePet("Squirrel")]);
    const shop = makeShop(["Ant"], ["Apple", "Pill"]);
    const { shop: result } = fireBoardShopAbility("start-of-turn", board, shop, PET_REGISTRY);
    expect(result.shopFoods.map((f) => f.discount)).toEqual([1, 1]);
    expect(result.shopPets[0].discount).toBeUndefined();
  });

  it("scales the discount linearly with level", () => {
    for (const level of [1, 2, 3]) {
      const { shop } = fireBoardShopAbility("start-of-turn", makeBoard([makePet("Squirrel", level)]), makeShop([], ["Apple"]), PET_REGISTRY);
      expect(shop.shopFoods[0].discount).toBe(level);
    }
  });

  it("stacks with a second Squirrel", () => {
    const board = makeBoard([makePet("Squirrel"), makePet("Squirrel")]);
    const { shop: result } = fireBoardShopAbility("start-of-turn", board, makeShop([], ["Apple"]), PET_REGISTRY);
    expect(result.shopFoods[0].discount).toBe(2);
  });

  it("makes food cheaper to buy, never below 0", () => {
    const board = makeBoard([makePet("Squirrel")]);
    const { shop } = fireBoardShopAbility("start-of-turn", board, makeShop([], ["Apple", "Pill"]), PET_REGISTRY);
    expect(getFoodCost(shop.shopFoods[0], FOOD_REGISTRY["Apple"])).toBe(2);
    expect(getFoodCost(shop.shopFoods[1], FOOD_REGISTRY["Pill"])).toBe(0);
  });

  it("does not mutate the shop it was given", () => {
    const shop = makeShop([], ["Apple"]);
    fireBoardShopAbility("start-of-turn", makeBoard([makePet("Squirrel")]), shop, PET_REGISTRY);
    expect(shop.shopFoods[0].discount).toBeUndefined();
  });

  it("has no effect when there is no Squirrel", () => {
    const { shop } = fireBoardShopAbility("start-of-turn", makeBoard([makePet("Swan")]), makeShop([], ["Apple"]), PET_REGISTRY);
    expect(shop.shopFoods[0].discount).toBeUndefined();
  });
});

describe("Bison — end-turn", () => {
  it("gains +2/+2 when it has a level-3 friend", () => {
    const bison = makePet("Bison");
    const levelThreeFriend = makePet("Sloth", 3);
    const board = makeBoard([bison, levelThreeFriend]);
    const { board: result } = fireBoardShopAbility("end-turn", board, makeShop(), PET_REGISTRY, "WIN");
    expect((result[0] as PetInstance).attack).toBe(3);
    expect((result[0] as PetInstance).health).toBe(3);
  });

  it("no-op without a level-3 friend", () => {
    const bison = makePet("Bison");
    const friend = makePet("Sloth", 1);
    const board = makeBoard([bison, friend]);
    const { board: result } = fireBoardShopAbility("end-turn", board, makeShop(), PET_REGISTRY, "WIN");
    expect((result[0] as PetInstance).attack).toBe(1);
    expect((result[0] as PetInstance).health).toBe(1);
  });

  it("only the first Bison on the board applies the buff", () => {
    const bison1 = makePet("Bison");
    const bison2 = makePet("Bison");
    const levelThreeFriend = makePet("Sloth", 3);
    const board = makeBoard([bison1, bison2, levelThreeFriend]);
    const { board: result } = fireBoardShopAbility("end-turn", board, makeShop(), PET_REGISTRY, "WIN");
    expect((result[0] as PetInstance).attack).toBe(3);
    expect((result[1] as PetInstance).attack).toBe(1); // second Bison unaffected
  });
});

describe("Snail — end-turn", () => {
  it("gives 3 nearest friends ahead +1 attack after a loss", () => {
    const friends = [makePet("Sloth"), makePet("Sloth"), makePet("Sloth")];
    const snail = makePet("Snail");
    const board = makeBoard([...friends, snail]);
    const { board: result } = fireBoardShopAbility("end-turn", board, makeShop(), PET_REGISTRY, "LOSS");
    expect((result[0] as PetInstance).attack).toBe(2);
    expect((result[1] as PetInstance).attack).toBe(2);
    expect((result[2] as PetInstance).attack).toBe(2);
  });

  it("no-op when the last battle was not a loss", () => {
    const friend = makePet("Sloth");
    const snail = makePet("Snail");
    const board = makeBoard([friend, snail]);
    const { board: result } = fireBoardShopAbility("end-turn", board, makeShop(), PET_REGISTRY, "WIN");
    expect((result[0] as PetInstance).attack).toBe(1);
  });

  it("buffs only the friends that exist when fewer than 3 are ahead", () => {
    const friend = makePet("Sloth");
    const snail = makePet("Snail");
    const board = makeBoard([friend, snail]);
    const { board: result } = fireBoardShopAbility("end-turn", board, makeShop(), PET_REGISTRY, "LOSS");
    expect((result[0] as PetInstance).attack).toBe(2);
  });
});

describe("Bread perk — end-turn / start-of-turn", () => {
  it("grants +7 health at end-turn, recorded as temporary", () => {
    const breadPet: PetInstance = { type: "Sloth", attack: 1, health: 5, perk: "Bread", xp: 1, level: 1 };
    const board = makeBoard([breadPet]);
    const { board: result } = fireBoardShopAbility("end-turn", board, makeShop(), PET_REGISTRY);
    expect((result[0] as PetInstance).health).toBe(12);
    expect((result[0] as PetInstance).tempHealth).toBe(7);
  });

  it("removes the +7 at start-of-turn", () => {
    const breadPet: PetInstance = { type: "Sloth", attack: 1, health: 12, perk: "Bread", tempHealth: 7, xp: 1, level: 1 };
    const board = makeBoard([breadPet]);
    const { board: result } = fireBoardShopAbility("start-of-turn", board, makeShop(), PET_REGISTRY);
    expect((result[0] as PetInstance).health).toBe(5);
    expect((result[0] as PetInstance).tempHealth).toBeUndefined();
  });

  it("still removes the +7 at start-of-turn after the perk was replaced", () => {
    const garlicPet: PetInstance = { type: "Sloth", attack: 1, health: 12, perk: "Garlic", tempHealth: 7, xp: 1, level: 1 };
    const board = makeBoard([garlicPet]);
    const { board: result } = fireBoardShopAbility("start-of-turn", board, makeShop(), PET_REGISTRY);
    expect((result[0] as PetInstance).health).toBe(5);
  });
});

describe("fireShopFaint — Pill", () => {
  it("fires the target's faint ability, landing any summon in the same slot", () => {
    const cricket = makePet("Cricket");
    const board = makeBoard([cricket]);
    const result = fireShopFaint(board, 0, PET_REGISTRY);
    expect(result[0]?.type).toBe("Zombie Cricket");
  });

  it("just removes a pet with no faint ability", () => {
    const sloth = makePet("Sloth");
    const board = makeBoard([sloth]);
    const result = fireShopFaint(board, 0, PET_REGISTRY);
    expect(result[0]).toBeNull();
  });

  it("splashes compacted neighbors for a pet like Badger", () => {
    const sloth1 = makePet("Sloth");
    const badger: PetInstance = { type: "Badger", attack: 6, health: 3, perk: null, xp: 1, level: 1 };
    const sloth2 = makePet("Sloth");
    const board = makeBoard([sloth1, badger, sloth2]);
    const result = fireShopFaint(board, 1, PET_REGISTRY);
    // Badger's faint deals 50% of its attack (3) to both compacted neighbors.
    expect((result[0] as PetInstance).health).toBe(-2); // 1 - 3
    expect((result[2] as PetInstance).health).toBe(-2);
    expect(result[1]).toBeNull();
  });
});

describe("fireShopFriendSummoned — Horse", () => {
  it("gives the newly bought pet +1 attack per level when bought into the shop", () => {
    const horse = makePet("Horse", 1);
    const sloth = makePet("Sloth");
    const board = makeBoard([horse, sloth]);
    const result = fireShopFriendSummoned(board, 1, PET_REGISTRY);
    expect((result[1] as PetInstance).attack).toBe(2); // Sloth got +1 (Horse level 1)
    expect((result[0] as PetInstance).attack).toBe(1); // Horse itself unchanged
  });

  it("scales the bonus with Horse's level", () => {
    const horse = makePet("Horse", 3);
    const sloth = makePet("Sloth");
    const board = makeBoard([horse, sloth]);
    const result = fireShopFriendSummoned(board, 1, PET_REGISTRY);
    expect((result[1] as PetInstance).attack).toBe(4); // +3
  });

  it("does not fire for the pet that was itself just summoned", () => {
    const horse = makePet("Horse", 1);
    const board = makeBoard([horse]);
    const result = fireShopFriendSummoned(board, 0, PET_REGISTRY);
    expect((result[0] as PetInstance).attack).toBe(1); // unchanged, no other friends
  });

  it("no-op when no pet has a friend-summoned ability", () => {
    const sloth1 = makePet("Sloth");
    const sloth2 = makePet("Sloth");
    const board = makeBoard([sloth1, sloth2]);
    const result = fireShopFriendSummoned(board, 1, PET_REGISTRY);
    expect((result[0] as PetInstance).attack).toBe(1);
  });
});

describe("Temporary stats — Horse in the shop", () => {
  it("records Horse's shop buff as temporary attack", () => {
    const horse = makePet("Horse", 2);
    const sloth = makePet("Sloth");
    const result = fireShopFriendSummoned(makeBoard([horse, sloth]), 1, PET_REGISTRY);
    expect((result[1] as PetInstance).attack).toBe(3);
    expect((result[1] as PetInstance).tempAttack).toBe(2);
  });

  it("removes temp attack at start-of-turn even with no Horse left on the board", () => {
    const buffed: PetInstance = { ...makePet("Sloth"), attack: 3, tempAttack: 2 };
    const { board } = fireBoardShopAbility("start-of-turn", makeBoard([buffed]), makeShop(), PET_REGISTRY);
    expect((board[0] as PetInstance).attack).toBe(1);
    expect((board[0] as PetInstance).tempAttack).toBeUndefined();
  });

  it("keeps temp attack through end-turn (it lasts into the battle)", () => {
    const buffed: PetInstance = { ...makePet("Sloth"), attack: 3, tempAttack: 2 };
    const { board } = fireBoardShopAbility("end-turn", makeBoard([buffed]), makeShop(), PET_REGISTRY);
    expect((board[0] as PetInstance).attack).toBe(3);
    expect((board[0] as PetInstance).tempAttack).toBe(2);
  });
});
