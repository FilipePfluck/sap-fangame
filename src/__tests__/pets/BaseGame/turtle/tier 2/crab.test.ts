import { describe, it, expect } from "vitest";
import { simulateBattle } from "@/lib/game/battle";
import { pet } from "@/__tests__/helpers";
import { PET_REGISTRY } from "@/lib/pets";

describe("Crab", () => {
  it.each([
    { level: 1, effect: "25%", result: "Crab (4/6)" },
    { level: 2, effect: "50%", result: "Crab (4/11)" },
    { level: 3, effect: "75%", result: "Crab (4/16)" },
  ])(
    "gains health equal to $effect of its healthiest friend's health at level $level",
    ({ level, result }) => {
      const { steps } = simulateBattle(
        [
          pet({ type: "Crab", attack: 4,  level }),
          pet({ health: 20 }),
        ],
        [pet({ health: 50 })],
        PET_REGISTRY
      );

      expect(steps[1].description).toContain(result);
    }
  );

  it("no-op when there are no friends", () => {
    const { steps } = simulateBattle(
      [pet({ type: "Crab", attack: 4 })],
      [pet({ health: 50 })],
      PET_REGISTRY
    );
    expect(steps[1].description).toContain("Crab (4/1)");
  });
});
