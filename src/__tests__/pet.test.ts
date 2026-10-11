import { describe, expect, it } from "vitest";
import {
  createAbilityMap,
  incrementTriggerCount,
  tryIncrementTriggerCount,
} from "@/lib/pets/ability";
import { serializePetData } from "@/lib/game/pet";
import {
  Trigger,
  type Ability,
  type PetInstance,
  type StaticPet,
} from "@/lib/types";

describe("pet ability data", () => {
  it("stores multiple abilities by trigger", () => {
    const buyAbility: Ability = {
      trigger: Trigger.buy,
      fn: () => {},
    };
    const faintAbility: Ability = {
      trigger: Trigger.faint,
      fn: () => {},
    };

    const abilities = createAbilityMap(buyAbility, faintAbility);

    expect(abilities.get(Trigger.buy)).toBe(buyAbility);
    expect(abilities.get(Trigger.faint)).toBe(faintAbility);
  });

  it("serializes ability triggers without serializing runtime functions", () => {
    const pet: StaticPet = {
      name: "Test Pet",
      sprite: "/test.webp",
      tier: 1,
      baseAttack: 1,
      baseHealth: 1,
      isToken: false,
      abilities: createAbilityMap({
        trigger: Trigger.buy,
        fn: () => {},
      }),
      description: (level) => `Ability at level ${level}.`,
    };

    const data = serializePetData(pet, 2);

    expect(data).toMatchObject({
      name: "Test Pet",
      abilities: [{ trigger: Trigger.buy }],
      description: "Ability at level 2.",
    });
    expect(JSON.parse(JSON.stringify(data))).toEqual(data);
    expect(data.abilities[0]).not.toHaveProperty("fn");
  });
});

describe("pet trigger counts", () => {
  const makePet = (): PetInstance => ({
    type: "Test Pet",
    attack: 1,
    health: 1,
    perk: null,
    xp: 0,
    level: 1,
  });

  it("activates every Nth trigger with a modulus check", () => {
    const pet = makePet();
    const activations: number[] = [];
    for (let i = 1; i <= 9; i++) {
      if (incrementTriggerCount(pet, Trigger.hurt) % 4 === 0) {
        activations.push(i);
      }
    }

    expect(activations).toEqual([4, 8]);
    expect(pet.triggerCountsThisTurn).toEqual({ [Trigger.hurt]: 9 });
  });

  it("stops activating once the trigger limit is reached", () => {
    const pet = makePet();
    const activations: number[] = [];
    for (let i = 1; i <= 5; i++) {
      if (tryIncrementTriggerCount(pet, Trigger.knock_out, 3)) {
        activations.push(i);
      }
    }

    expect(activations).toEqual([1, 2, 3]);
    expect(pet.triggerCountsThisTurn).toEqual({ [Trigger.knock_out]: 3 });
  });

  it("counts each trigger separately", () => {
    const pet = makePet();
    incrementTriggerCount(pet, Trigger.hurt);
    incrementTriggerCount(pet, Trigger.hurt);

    expect(incrementTriggerCount(pet, Trigger.knock_out)).toBe(1);
  });
});
