import { describe, it, expect } from "vitest";
import { pet } from "@/__tests__/helpers";
import { Battle } from "@/lib/game/battle";

describe("Flamingo", () => {
  it.each([
    {
      level: 1,
      expected: ["Sloth (2/2)", "Sloth (2/2)", "Sloth (1/1)", "Sloth (1/1)"],
    },
    {
      level: 2,
      expected: ["Sloth (3/3)", "Sloth (3/3)", "Sloth (1/1)", "Sloth (1/1)"],
    },
    {
      level: 3,
      expected: ["Sloth (4/4)", "Sloth (4/4)", "Sloth (1/1)", "Sloth (1/1)"],
    },
  ])(
    "gives the two nearest friends behind +$level/+$level at level $level",
    ({ level, expected }) => {
      const { steps } = Battle.fromPetArray({
        playerPets: [
          pet({ type: "Flamingo", level }),
          pet(),
          pet(),
          pet(),
          pet(),
        ],
        enemyPets: [pet()],
      });

      expect(steps[1].summary.playerTeam.map(p => p?.toString())).toEqual(expected);
    }
  );

  it("skips pending faints and buffs the nearest living friends behind", () => {
    const { steps } = Battle.fromPetArray({
      playerPets: [
        pet({ type: "Flamingo" }),
        pet({ health: 0 }),
        pet(),
        pet(),
      ],
      enemyPets: [pet()],
    });

    expect(steps[1].summary.playerTeam.length).toBe(2);
    expect(steps[1].summary.playerTeam[0]).toMatchObject({
      attack: 2,
      health: 2,
    });
    expect(steps[1].summary.playerTeam[1]).toMatchObject({
      attack: 2,
      health: 2,
    });
  });
});