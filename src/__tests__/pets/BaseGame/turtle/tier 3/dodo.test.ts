import { describe, it, expect } from "vitest";
import { pet } from "@/__tests__/helpers";
import { simulateBattle } from "@/lib/game/battle";
import { PET_REGISTRY } from "@/lib/pets";
import { petToString } from "@/lib/utils/flavor-text";

describe("Dodo", () => {
  it.each([
    { level: 1, ability: "50%", result: "Ant (3/5)" },
    { level: 2, ability: "100%", result: "Ant (5/5)" },
    { level: 3, ability: "150%", result: "Ant (7/5)" },
  ])(
    "gives $ability of its attack to the nearest friend ahead at level $level",
    ({ level, result }) => {
      const { steps } = simulateBattle(
        [
          pet({ health: 5 }),
          pet({ type: "Ant", health: 5 }),
          pet({ type: "Dodo", attack: 4, health: 2, level }),
        ],
        [pet({ health: 50 })],
        PET_REGISTRY
      );

      expect(petToString(steps[0].attackerTeam[1])).toBe("Ant (1/5)");
      expect(petToString(steps[1].attackerTeam[1])).toBe(result);
    }
  );
});
