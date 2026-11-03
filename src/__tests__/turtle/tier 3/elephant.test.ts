import { describe, it, expect } from "vitest";
import { pet } from "@/__tests__/helpers";
import { Battle } from "@/lib/game/battle";

describe("Elephant", () => {
  it.each([
    { level: 1, expectedHealth: 9 },
    { level: 2, expectedHealth: 8 },
    { level: 3, expectedHealth: 7 },
  ])(
    "deals 1 damage at level $level to the friend behind",
    ({ level, expectedHealth }) => {
      const { steps } = Battle.fromPetArray({
        playerPets: [pet({ type: "Elephant", level }), pet({ health: 10 })],
        enemyPets: [pet({ attack: 0 })],
      });

      expect(steps[1].summary.playerTeam[1]?.health).toBe(expectedHealth);
    }
  );

  it("targets only the nearest friend behind", () => {
    const { steps } = Battle.fromPetArray({
      playerPets: [
        pet({ type: "Elephant", level: 2 }),
        pet({ health: 10 }),
        pet({ health: 10 }),
      ],
      enemyPets: [pet({ attack: 0 })],
    });

    expect(steps[1].summary.playerTeam[1]?.health).toBe(8);
    expect(steps[1].summary.playerTeam[2]?.health).toBe(10);
  });

  it("retargets a living friend if the first one faints", () => {
    const { steps } = Battle.fromPetArray({
      playerPets: [
        pet({ type: "Elephant", level: 2 }),
        pet(),
        pet({ health: 9 }),
      ],
      enemyPets: [pet({ attack: 0 })],
    });

    expect(steps[1].summary.playerTeam).toHaveLength(2);
    expect(steps[1].summary.playerTeam[1]?.health).toBe(8);
  });
});
