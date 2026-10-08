import { describe, expect, it } from "vitest";
import { createAbilityMap } from "@/lib/pets/ability";
import { serializePetData } from "@/lib/game/pet";
import { Trigger, type Ability, type StaticPet } from "@/lib/types";

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
