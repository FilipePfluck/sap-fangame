import { describe, it, expect } from "vitest";
import { pet } from "@/__tests__/helpers";
import { Battle } from "@/lib/game/battle";

describe("Kangaroo", () => {
  it.each([
    { level: 1, expected: "Kangaroo (2/2)" },
    { level: 2, expected: "Kangaroo (3/3)" },
    { level: 3, expected: "Kangaroo (4/4)" },
  ])(
    "gains +$level/+$level when its friend ahead attacks at level $level",
    ({ level, expected }) => {
      const { steps } = Battle.fromPetArray({
        playerPets: [pet({ health: 2 }), pet({ type: "Kangaroo", level })],
        enemyPets: [pet()],
      });

      expect(steps[1].summary.playerTeam[1]?.toString()).toBe(expected);
    }
  );

  it("does not trigger from its own attack when a friend is behind", () => {
    const { steps } = Battle.fromPetArray({
      playerPets: [pet({ type: "Kangaroo", attack: 2, health: 2 }), pet()],
      enemyPets: [pet()],
    });

    expect(steps[1].summary.playerTeam[0]?.toString()).toBe("Kangaroo (2/1)");
  });
});
