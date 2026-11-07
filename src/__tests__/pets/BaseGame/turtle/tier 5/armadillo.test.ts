import { describe, it, expect } from "vitest";
import { battleContext, pet } from "@/__tests__/helpers";
import { PET_REGISTRY } from "@/lib/pets";
import { Trigger } from "@/lib/types";
import { simulateBattle } from "@/lib/game/battle";

describe("Armadillo", () => {
  it.each([
    { level: 1, bonus: 8 },
    { level: 2, bonus: 16 },
    { level: 3, bonus: 24 },
  ])(
    "gives all living pets +$bonus health at level $level",
    ({ level, bonus }) => {
      const { steps } = simulateBattle(
        [
          pet({ type: "Armadillo", attack: 4, health: 8, level }),
          pet({  health: 20 }),
        ],
        [pet({  health: 20 })],
        PET_REGISTRY
      );

      expect(steps[1].attackerTeam[0].health).toBe(7 + bonus);
      expect(steps[1].attackerTeam[1].health).toBe(20 + bonus);
      expect(steps[1].defenderTeam[0].health).toBe(16 + bonus);
    }
  );

  it("does not buff pets at zero or negative health", () => {
    const armadillo = pet({ type: "Armadillo", attack: 4, health: 8 });
    const deadFriend = pet({  health: 0 });
    const overkilledFriend = pet({  health: -3 });
    const livingFriend = pet({  health: 10 });
    const ability = PET_REGISTRY.Armadillo.abilities.get(
      Trigger.start_of_battle
    );
    if (!ability || ability.trigger !== Trigger.start_of_battle) {
      throw new Error("Expected Armadillo start-of-battle ability");
    }

    ability.fn(
      battleContext(
        armadillo,
        [armadillo, deadFriend, overkilledFriend, livingFriend],
        []
      )
    );

    expect(armadillo.health).toBe(16);
    expect(deadFriend.health).toBe(0);
    expect(overkilledFriend.health).toBe(-3);
    expect(livingFriend.health).toBe(18);
  });
});
