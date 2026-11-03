import { describe, it, expect } from "vitest";
import { pet } from "@/__tests__/helpers";
import { Battle } from "@/lib/game/battle";

describe("Horse", () => {
  it.each([
    { level: 1, result: "Zombie Cricket (2/1)" },
    { level: 2, result: "Zombie Cricket (3/1)" },
    { level: 3, result: "Zombie Cricket (4/1)" },
  ])(
    "gives summoned pets +$level attack at level $level",
    ({ level, result }) => {
      // NOTE: Test can fail due to Cricket being incorrectly implemented
      // Sloth kills Cricket, Cricket summons 1/1 Zombie Cricket, test confirms Horse provides an appropriate buff
      const battle = Battle.fromPetArray({
        playerPets: [pet({ type: "Cricket" }), pet({ type: "Horse", level })],
        enemyPets: [pet()],
      });

      expect(battle.steps[0].summary.playerTeam[0]?.toString()).toBe(result);
    }
  );
});
