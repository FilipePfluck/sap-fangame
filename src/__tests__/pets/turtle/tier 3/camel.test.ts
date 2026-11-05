import { describe, it, expect } from "vitest";
import { simulateBattle } from "@/lib/game/battle";
import { battleContext, pet } from "@/__tests__/helpers";
import { PET_REGISTRY } from "@/lib/pets";
import { petToString } from "@/lib/utils/flavor-text";
import { Trigger } from "@/lib/types";

describe("Camel", () => {
  it.each([
    { level: 1, ability: "+1/+2", result: "Sloth (2/12)" },
    { level: 2, ability: "+2/+4", result: "Sloth (3/14)" },
    { level: 3, ability: "+3/+6", result: "Sloth (4/16)" },
  ])(
    "gives the nearest friend behind $ability when damaged at level $level",
    ({ level, result }) => {
      const { steps } = simulateBattle(
        [
          pet({ type: "Camel", attack: 3, health: 3, level }),
          pet({ health: 10 }),
        ],
        [pet({ health: 100 })],
        PET_REGISTRY
      );

      expect(petToString(steps[1].attackerTeam[1])).toBe(result);
    }
  );

  it("skips a pending faint to buff the nearest living friend behind", () => {
    const camel = pet({ type: "Camel", attack: 3, health: 3 });
    const deadFriend = pet({ health: 0 });
    const livingFriend = pet({ health: 10 });
    const ability = PET_REGISTRY.Camel.abilities.get(Trigger.hurt);
    if (!ability || ability.trigger !== Trigger.hurt)
      throw new Error("Expected hurt ability");

    ability.fn(battleContext(camel, [camel, deadFriend, livingFriend], []));

    expect(deadFriend).toMatchObject({ health: 0 });
    expect(livingFriend).toMatchObject({ attack: 2, health: 12 });
  });
});
