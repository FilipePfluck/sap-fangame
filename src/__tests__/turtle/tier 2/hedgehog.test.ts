import { describe, it, expect } from "vitest";
import { pet } from "@/__tests__/helpers";
import { Battle } from "@/lib/game/battle";

describe("Hedgehog", () => {
  it.each([
    { level: 1, damage: 2, expectedHealth: 8 },
    { level: 2, damage: 4, expectedHealth: 6 },
    { level: 3, damage: 6, expectedHealth: 4 },
  ])(
    "deals $damage damage to every living pet on both teams at level $level",
    ({ level, expectedHealth }) => {
      const livingFriend = pet({ health: 10 });
      const deadFriend = pet({ health: 0 });
      const enemy = pet({ health: 10 });

      const { steps } = Battle.fromPetArray({
        playerPets: [pet({ type: "Hedgehog", level }), livingFriend, deadFriend],
        enemyPets: [pet(), enemy],
      });

      expect(steps[1].summary.opposingTeam[0]?.health).toBe(expectedHealth);
      expect(steps[1].summary.playerTeam[0]?.health).toBe(expectedHealth);
      expect(steps[1].summary.playerTeam[1]?.health).toBe(0);
    }
  );
});