import { describe, expect, it } from "vitest";
import {
  fireBoardShopAbility,
  fireShopAbility,
  fireShopFaint,
  fireShopFriendBought,
  fireShopFriendSummoned,
} from "@/lib/game/shop-ability";
import { PET_REGISTRY } from "@/lib/pets";
import {
  Apple,
} from "@/lib/foods";
import { applyFoodEffect } from "@/lib/game/food";
import { grantExperience } from "@/lib/game/merge";
import { ApiBoard, PetData, ShopState, Trigger } from "@/lib/types";
import { BreadPerk } from "@/lib/perks/bread";
import { GarlicPerk } from "@/lib/perks/garlic";
import { HoneyPerk } from "@/lib/perks/honey";
import { staticPet, makeBoard, makeShop, pet, registryWith } from "./helpers";


describe("Ability-granted experience", () => {
  it("grants stats without exceeding the XP cap", () => {
    const experienceGiver = staticPet("Experience Giver", {
      trigger: Trigger.buy,
      fn: (ctx) => {
        const target = ctx.board[1];
        if (target) grantExperience(target, 1);
      },
    });
    const board = makeBoard([
      pet({ type: "Experience Giver" }),
      pet({ type: "Sloth", level: 3, attack: 2, health: 2 }),
    ]);
    const result = fireShopAbility(
      Trigger.buy,
      board[0]!,
      0,
      board,
      makeShop(),
      registryWith(experienceGiver)
    ).board;

    expect(result[1]).toMatchObject({
      attack: 3,
      health: 3,
      xp: 5,
      level: 3,
    });
  });
});

describe("Shop capacity", () => {
  const petsNamed = (names: string[]) =>
    names.map((type) => ({ type, frozen: false }));

  it("stocking food deletes pets from the rightmost pet, keeping existing foods", () => {
    // 8 pets + 1 food = 9. Level-3 Pigeon stocks 3 Bread Crumbs: the first
    // fits, the next two each delete the rightmost pet.
    const pigeon = pet({ type:  "Pigeon", level: 3 });
    const shop: ShopState = {
      shopPets: petsNamed(["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8"]),
      shopFoods: [{ type: "Garlic", frozen: false }],
    };
    const { shop: result } = fireShopAbility(
      Trigger.sell,
      pigeon,
      0,
      makeBoard([pigeon]),
      shop,
      PET_REGISTRY
    );
    expect(result.shopPets.map((p) => p.type)).toEqual([
      "P1",
      "P2",
      "P3",
      "P4",
      "P5",
      "P6",
    ]);
    expect(result.shopFoods.map((f) => f.type)).toEqual([
      "Garlic",
      "Bread Crumbs",
      "Bread Crumbs",
      "Bread Crumbs",
    ]);
  });

  it("deletes the rightmost pet to stock food into a completely full shop", () => {
    const pigeon = pet({ type:  "Pigeon" });
    const shop: ShopState = {
      shopPets: petsNamed([
        "P1",
        "P2",
        "P3",
        "P4",
        "P5",
        "P6",
        "P7",
        "P8",
        "P9",
        "P10",
      ]),
      shopFoods: [],
    };
    const { shop: result } = fireShopAbility(
      Trigger.sell,
      pigeon,
      0,
      makeBoard([pigeon]),
      shop,
      PET_REGISTRY
    );
    expect(result.shopPets.map((p) => p.type)).not.toContain("P10");
    expect(result.shopPets).toHaveLength(9);
    expect(result.shopFoods).toHaveLength(1);
  });

  it("frozen pets are never deleted and win over new food", () => {
    const pigeon = pet({ type:  "Pigeon" });
    const shop: ShopState = {
      shopPets: Array(10)
        .fill(null)
        .map(() => ({ type: "Sloth", frozen: true })),
      shopFoods: [],
    };
    const { shop: result } = fireShopAbility(
      Trigger.sell,
      pigeon,
      0,
      makeBoard([pigeon]),
      shop,
      PET_REGISTRY
    );
    expect(result.shopPets).toHaveLength(10);
    expect(result.shopFoods).toHaveLength(0);
  });

  it("skips frozen pets and deletes the rightmost unfrozen one", () => {
    const pigeon = pet({ type:  "Pigeon" });
    const shop: ShopState = {
      shopPets: [
        { type: "Ant", frozen: false },
        { type: "Duck", frozen: false },
        ...Array(8)
          .fill(null)
          .map(() => ({ type: "Sloth", frozen: true })),
      ],
      shopFoods: [],
    };
    const { shop: result } = fireShopAbility(
      Trigger.sell,
      pigeon,
      0,
      makeBoard([pigeon]),
      shop,
      PET_REGISTRY
    );
    expect(result.shopPets.map((p) => p.type)).not.toContain("Duck");
    expect(result.shopPets.map((p) => p.type)).toContain("Ant");
    expect(result.shopFoods).toHaveLength(1);
  });

  it("frozen pets block stocking even when unfrozen foods exist", () => {
    const pigeon = pet({ type:  "Pigeon" });
    const shop: ShopState = {
      shopPets: Array(8)
        .fill(null)
        .map(() => ({ type: "Sloth", frozen: true })),
      shopFoods: [
        { type: "Apple", frozen: false },
        { type: "Honey", frozen: false },
      ],
    };
    const { shop: result } = fireShopAbility(
      Trigger.sell,
      pigeon,
      0,
      makeBoard([pigeon]),
      shop,
      PET_REGISTRY
    );
    // falls back to the oldest food so the new one still fits
    expect(result.shopFoods.map((f) => f.type)).toEqual([
      "Honey",
      "Bread Crumbs",
    ]);
    expect(result.shopPets).toHaveLength(8);
  });
});

describe("Pending faints", () => {
  it("fires a shop ability after its pet faints", () => {
    const fired: number[] = [];
    const killer = staticPet("Killer", {
      trigger: Trigger.end_turn,
      fn: (ctx) => {
        const friend = ctx.board[1];
        if (friend) friend.health = 0;
      },
    });
    const listener = staticPet("Listener", {
      trigger: Trigger.end_turn,
      fn: ({ self }) => fired.push(self.health),
    });
    const board = makeBoard([
      pet({ type:  "Killer", attack: 9}),
      pet({ type:  "Listener" }),
    ]);

    fireBoardShopAbility(
      Trigger.end_turn,
      board,
      makeShop(),
      registryWith(killer, listener)
    );

    expect(fired).toEqual([0]);
  });
});

describe("Ability order", () => {
  it("fires end-turn abilities from highest attack to lowest", () => {
    const order: string[] = [];
    const listener = (name: string) =>
      staticPet(name, {
        trigger: Trigger.end_turn,
        fn: ({ self }) => order.push(self.type),
      });
    const registry = registryWith(listener("Low"), listener("High"));
    const board = makeBoard([
      pet({ type:  "Low" }),
      pet({ type:  "High", attack: 9 }),
    ]);

    fireBoardShopAbility(Trigger.end_turn, board, makeShop(), registry);

    expect(order).toEqual(["High", "Low"]);
  });

  it("fires friend-bought abilities from highest attack to lowest", () => {
    const order: string[] = [];
    const listener = (name: string) =>
      staticPet(
        name,
        {
          trigger: Trigger.friend_bought,
          fn: ({ self }) => order.push(self.type),
        },
        6
      );
    const low = listener("Low Dragon");
    const high = listener("High Dragon");
    const registry = registryWith(low, high);
    const board = makeBoard([
      pet({ type:  "Low Dragon" }),
      pet({ type:  "High Dragon", attack: 9 }),
    ]);

    fireShopFriendBought(PET_REGISTRY.Sloth, board, makeShop(), registry);

    expect(order).toEqual([high.name, low.name]);
  });

  it("fires food-eaten abilities from highest attack to lowest", () => {
    const order: string[] = [];
    const listener = (name: string) =>
      staticPet(name, {
        trigger: Trigger.friend_ate_food,
        fn: ({ self }) => order.push(self.type),
      });
    const registry = registryWith(listener("Low"), listener("High"));
    const board: ApiBoard = [
      pet({ type:  "Low", attack: 1 }),
      pet({ type:  "High", attack: 9 }),
      pet(),
    ];

    applyFoodEffect(Apple, board, 2, registry);

    expect(order).toEqual(["High", "Low"]);
  });
});

describe("Bread perk", () => {
  it("grants +7 health at end-turn, recorded as temporary", () => {
    const breadPet: PetData = {
      type: "Sloth",
      attack: 1,
      health: 5,
      perk: BreadPerk,
      xp: 1,
      level: 1,
    };
    const board = makeBoard([breadPet]);
    const { board: result } = fireBoardShopAbility(
      Trigger.end_turn,
      board,
      makeShop(),
      PET_REGISTRY
    );
    expect((result[0] as PetData).health).toBe(12);
    expect((result[0] as PetData).tempHealth).toBe(7);
  });

  it("removes the +7 at start-of-turn", () => {
    const breadPet: PetData = {
      type: "Sloth",
      attack: 1,
      health: 12,
      perk: BreadPerk,
      tempHealth: 7,
      xp: 1,
      level: 1,
    };
    const board = makeBoard([breadPet]);
    const { board: result } = fireBoardShopAbility(
      Trigger.start_of_turn,
      board,
      makeShop(),
      PET_REGISTRY
    );
    expect((result[0] as PetData).health).toBe(5);
    expect((result[0] as PetData).tempHealth).toBeUndefined();
  });

  it("temporary health does not exceed stat caps", () => {
    const breadPet: PetData = {
      type: "Sloth",
      attack: 1,
      health: 50,
      perk: BreadPerk,
      xp: 1,
      level: 1,
    };
    const board = makeBoard([breadPet]);
    const { board: result } = fireBoardShopAbility(
      Trigger.end_turn,
      board,
      makeShop(),
      PET_REGISTRY
    );
    expect((result[0] as PetData).health).toBe(50);
    expect((result[0] as PetData).tempHealth).toBe(0);
  });

  it("still removes the +7 at start-of-turn after the perk was replaced", () => {
    const garlicPet: PetData = {
      type: "Sloth",
      attack: 1,
      health: 12,
      perk: GarlicPerk,
      tempHealth: 7,
      xp: 1,
      level: 1,
    };
    const board = makeBoard([garlicPet]);
    const { board: result } = fireBoardShopAbility(
      Trigger.start_of_turn,
      board,
      makeShop(),
      PET_REGISTRY
    );
    expect((result[0] as PetData).health).toBe(5);
  });
});

describe("fireShopFaint", () => {
  it("fires the target's faint ability, landing any summon in the same slot", () => {
    const cricket = pet({ type:  "Cricket" });
    const board = makeBoard([cricket]);
    const result = fireShopFaint(board, 0, PET_REGISTRY);
    expect(result[0]?.type).toBe("Zombie Cricket");
  });

  it("flings later summons when the Pill opens only one slot", () => {
    const cricket = pet({ type:  "Cricket", perk: HoneyPerk });
    const board = makeBoard([cricket]);
    const result = fireShopFaint(board, 0, PET_REGISTRY);

    expect(result[0]?.type).toBe("Zombie Cricket");
    expect(result.some((pet) => pet?.type === "Bee")).toBe(false);
  });

  it("flings the second Ram when Sheep faints in a full shop board", () => {
    const board = makeBoard([
      pet({ type:  "Sheep" }),
      pet(),
      pet(),
      pet(),
      pet(),
    ]);
    const result = fireShopFaint(board, 0, PET_REGISTRY);

    expect(result.filter((pet) => pet?.type === "Ram")).toHaveLength(1);
  });

  it("fires Friend ahead faints for the pet behind", () => {
    const board = makeBoard([pet(), pet({ type:  "Ox" })]);
    const result = fireShopFaint(board, 0, PET_REGISTRY);

    expect(result[1]).toMatchObject({ attack: 2, health: 1 });
    expect(result[1]?.perk?.name).toBe("Melon");
  });

  it("fires Friend ahead faints once per turn", () => {
    const board = makeBoard([
      pet(),
      pet(),
      pet({ type:  "Ox" }),
    ]);
    const afterFirst = fireShopFaint(board, 1, PET_REGISTRY);
    const afterSecond = fireShopFaint(afterFirst, 0, PET_REGISTRY);

    expect(afterSecond[2]).toMatchObject({ attack: 2, health: 1 });
  });

  it("refreshes Friend ahead faints at start of turn", () => {
    const board = makeBoard([
      pet(),
      pet({ type:  "Ox", triggerCountsThisTurn: { [Trigger.friend_ahead_faints]: 1 } }),
    ]);
    const nextTurn = fireBoardShopAbility(
      Trigger.start_of_turn,
      board,
      makeShop(),
      PET_REGISTRY
    ).board;
    const result = fireShopFaint(nextTurn, 0, PET_REGISTRY);

    expect(result[1]).toMatchObject({ attack: 2, health: 1 });
  });

  it("summons a Bee when a Honey pet is pilled", () => {
    const honeySloth = pet({ perk: HoneyPerk });
    const result = fireShopFaint(makeBoard([honeySloth]), 0, PET_REGISTRY);

    expect(result[0]?.type).toBe("Bee");
  });

  it("just removes a pet with no faint ability", () => {
    const sloth = pet();
    const board = makeBoard([sloth]);
    const result = fireShopFaint(board, 0, PET_REGISTRY);
    expect(result[0]).toBeNull();
  });

  it("splashes compacted neighbors for a pet like Badger", () => {
    const sloth1 = pet();
    const badger: PetData = {
      type: "Badger",
      attack: 6,
      health: 3,
      perk: null,
      xp: 1,
      level: 1,
    };
    const sloth2 = pet();
    const board = makeBoard([sloth1, badger, sloth2]);
    const result = fireShopFaint(board, 1, PET_REGISTRY);
    // Badger's faint deals 50% of its attack (3) to both compacted neighbors.
    expect((result[0] as PetData).health).toBe(-2); // 1 - 3
    expect((result[2] as PetData).health).toBe(-2);
    expect(result[1]).toBeNull();
  });
});

describe("fireShopFriendSummoned", () => {
  it.each([
    { level: 1, expected: 2 },
    { level: 2, expected: 3 },
    { level: 3, expected: 4 },
  ])(
    "gives newly summoned pets from the shop +$level attack at level $level",
    ({ level, expected }) => {
      const horse = pet({ type: "Horse", level });
      const sloth = pet();
      const board = makeBoard([horse, sloth]);
      const result = fireShopFriendSummoned(board, 1, PET_REGISTRY);

      expect((result[1] as PetData).attack).toBe(expected);
    }
  );

  it("does not fire on itself when bought", () => {
    const horse = pet({ type: "Horse" });
    const board = makeBoard([horse]);
    const result = fireShopFriendSummoned(board, 0, PET_REGISTRY);

    expect((result[0] as PetData).attack).toBe(1);
  });

  // TODO - Should NOT be under "Horse" if this does not use "Horse."  Test seems valuable for confirming this function works w/o a summon friend
  it("no-op when no pet has a friend-summoned ability", () => {
    const sloth1 = pet();
    const sloth2 = pet();
    const board = makeBoard([sloth1, sloth2]);
    const result = fireShopFriendSummoned(board, 1, PET_REGISTRY);

    expect((result[0] as PetData).attack).toBe(1);
  });
});

describe("Temporary stats", () => {
  it("keeps temporary stats after end of turn", () => {
    const buffed: PetData = pet({ tempAttack: 2, tempHealth: 3 });
    const { board } = fireBoardShopAbility(
      Trigger.end_turn,
      makeBoard([buffed]),
      makeShop(),
      PET_REGISTRY
    );

    expect(board[0]?.tempAttack).toBe(2);
    expect(board[0]?.tempHealth).toBe(3);
  });

  it("removes temporary stats at start of turn", () => {
    const buffed: PetData = pet({ tempAttack: 3, tempHealth: 2 });
    const nextTurn = fireBoardShopAbility(
      Trigger.start_of_turn,
      makeBoard([buffed]),
      makeShop(),
      PET_REGISTRY
    ).board;

    expect(nextTurn[0]?.tempAttack).toBeUndefined();
    expect(nextTurn[0]?.tempHealth).toBeUndefined();
  });
});

describe("fireShopFriendSummoned", () => {
  it.each([
    { level: 1, expectedCount: 1 },
    { level: 2, expectedCount: 2 },
    { level: 3, expectedCount: 3 },
  ])(
    "grants +1 experience up to $expectedCount times at level $level",
    ({ level, expectedCount }) => {
      const alpaca = pet({ type:  "Alpaca", level });
      let board = makeBoard([
        alpaca,
        pet(),
        pet(),
        pet(),
      ]);

      for (let summonedIndex = 1; summonedIndex <= 3; summonedIndex++) {
        board = fireShopFriendSummoned(board, summonedIndex, PET_REGISTRY);
      }

      const summoned = board
        .slice(1)
        .filter((friend): friend is PetData => friend !== null);
      expect(summoned.filter((friend) => friend.xp === 1)).toHaveLength(
        expectedCount
      );
      expect(summoned.filter((friend) => friend.xp === 0)).toHaveLength(
        3 - expectedCount
      );
      expect(alpaca.triggerCountsThisTurn).toEqual({
        [Trigger.friend_summoned]: expectedCount,
      });
    }
  );
});

describe("fireShopFaint", () => {
  it("summons nothing in the shop, where there is no opposing team", () => {
    const board = makeBoard([pet({ type:  "Rat", level: 3 }), pet({ type:  "Horse" })]);
    const result = fireShopFaint(board, 0, PET_REGISTRY);

    expect(result[0]).toBeNull();
    expect(result[1]).toMatchObject({ type: "Horse", attack: 1 });
  });
});
