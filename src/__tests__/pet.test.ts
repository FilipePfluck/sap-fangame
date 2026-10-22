import { describe, expect, it } from "vitest";
import {
  createAbilityMap,
  incrementTriggerCount,
  tryIncrementTriggerCount,
} from "@/lib/pets/ability";
import { TransformPreserve, toPetData, transformPet } from "@/lib/game/pet";
import { AdultFlounder } from "@/lib/pets/SAPOther/adult-flounder";
import { HoneyPerk } from "@/lib/perks/honey";
import { pet } from "@/__tests__/helpers";
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

  it("PetData includes only JSON-parseable data", () => {
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

    const data = toPetData(pet, 2);

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

  it("activates on every fourth trigger", () => {
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

describe("transformPet", () => {
  function transform(preserve?: Map<TransformPreserve, boolean>): PetInstance {
    const transformed = pet({ type: "Flounder", attack: 5, health: 6, perk: HoneyPerk, level: 2, xp: 3 });
    transformPet(transformed, AdultFlounder, [], preserve);
    return transformed;
  }

  it("keeps stats, perk, level and experience by default", () => {
    expect(transform()).toMatchObject({
      type: "Adult Flounder",
      attack: 5,
      health: 6,
      perk: HoneyPerk,
      level: 2,
      xp: 3,
    });
  });

  it("gives the new pet's base stats when stats aren't preserved", () => {
    expect(transform(new Map([[TransformPreserve.stats, false]]))).toMatchObject({ attack: 2, health: 4 });
  });

  it("gives the new pet's innate perk when the perk isn't preserved", () => {
    expect(transform(new Map([[TransformPreserve.perk, false]])).perk).toBeNull();
  });

  it("resets to level 1 with no experience when the level isn't preserved", () => {
    expect(transform(new Map([[TransformPreserve.level, false]]))).toMatchObject({ level: 1, xp: 0 });
  });

  it("removes progress beyond its level when experience isn't preserved", () => {
    expect(transform(new Map([[TransformPreserve.experience, false]]))).toMatchObject({ level: 2, xp: 2 });
  });
});
