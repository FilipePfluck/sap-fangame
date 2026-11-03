import { describe, it, expect } from "vitest";
import { pet } from "@/__tests__/helpers";
import { Battle } from "@/lib/game/battle";

describe("Camel", () => {
  it.each([
    { level: 1, ability: "+1/+2", result: { attack: 2, health: 3 } },
    { level: 2, ability: "+2/+4", result: { attack: 3, health: 5 } },
    { level: 3, ability: "+3/+6", result: { attack: 4, health: 7 } },
  ])(
    "gives the nearest friend behind $ability when damaged at level $level",
    ({ level, result }) => {
      const { steps } = Battle.fromPetArray({
        playerPets: [pet({ type: "Camel", health: 2, level }), pet()],
        enemyPets: [pet()],
      });

      expect(steps[1].summary.playerTeam[1]).toMatchObject(result);
    }
  );

  it("skips a pending faint to buff the nearest living friend behind", () => {
    const { steps } = Battle.fromPetArray({
      playerPets: [pet({ type: "Camel" }), pet({ health: 0 }), pet()],
      enemyPets: [pet()],
    })

    expect(steps[1].summary.playerTeam.length).toBe(1);
    expect(steps[1].summary.playerTeam[0]).toMatchObject({ attack: 2, health: 3 });
  });
});
