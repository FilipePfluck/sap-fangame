import { describe, it, expect } from "vitest";
import { simulateBattle } from "@/lib/game/battle";
import { pet } from "@/__tests__/helpers";
import { PET_REGISTRY } from "@/lib/pets";

describe("Rat", () => {
  it.each([
    { level: 1, count: 1 },
    { level: 2, count: 2 },
    { level: 3, count: 3 },
  ])(
    "summons $count Dirty Rats at the front of the opposing team",
    ({ level, count }) => {
      const { steps } = simulateBattle(
        [pet({ type: "Rat", attack: 3,  level })],
        [pet({ type: "Horse", attack: 2, health: 10 })],
        PET_REGISTRY
      );

      const opposingTeam = steps[1].defenderTeam;
      expect(opposingTeam.slice(0, count).map((summon) => summon.type)).toEqual(
        Array(count).fill("Dirty Rat")
      );
      expect(opposingTeam[count]).toMatchObject({ type: "Horse", attack: 2 });
    }
  );

  it("does not activate the opponent's friend-summoned abilities", () => {
    const { steps } = simulateBattle(
      [pet({ type: "Rat", attack: 3,  level: 3 })],
      [pet({ type: "Horse", attack: 2, health: 10 })],
      PET_REGISTRY
    );
    const dirtyRats = steps[1].defenderTeam.filter(
      (enemy) => enemy.type === "Dirty Rat"
    );

    expect(dirtyRats.map((rat) => rat.attack)).toEqual([1, 1, 1]);
  });
});
