import { describe, it, expect } from "vitest";
import { pet } from "@/__tests__/helpers";
import { Battle } from "@/lib/game/battle";
import { PET_REGISTRY } from "@/lib/pets";
import { Trigger } from "@/lib/types";

describe("Armadillo — start of battle", () => {
  it.each([
    { level: 1, bonus: 8 },
    { level: 2, bonus: 16 },
    { level: 3, bonus: 24 },
  ])(
    "gives all living pets +$bonus health at level $level",
    ({ level, bonus }) => {
      const { steps } = Battle.fromPetArray({
        playerPets: [pet({ type: "Armadillo", level }), pet()],
        enemyPets: [pet({ attack: 0, health: 2 })],
      });

      expect(steps[1].summary.playerTeam[0]?.health).toBe(1 + bonus);
      expect(steps[1].summary.playerTeam[1]?.health).toBe(1 + bonus);
      expect(steps[1].summary.opposingTeam[0]?.health).toBe(1 + bonus);
    }
  );

  it("does not buff pets at zero or negative health", () => {
    const armadillo = pet({ type: "Armadillo" });
    const deadFriend = pet({ health: 0 });
    const overkilledFriend = pet({ health: -3 });
    const livingFriend = pet();
    const ability = PET_REGISTRY.Armadillo.ability;
    if (ability?.trigger !== Trigger.start_of_battle) {
      throw new Error("Expected Armadillo start-of-battle ability");
    }

    ability.fn(
      battleContext(
        armadillo,
        [armadillo, deadFriend, overkilledFriend, livingFriend],
        []
      )
    );

    expect(armadillo.health).toBe(9);
    expect(deadFriend.health).toBe(0);
    expect(overkilledFriend.health).toBe(-3);
    expect(livingFriend.health).toBe(9);
  });
});
