import { describe, it, expect } from "vitest";
import { simulateBattle } from "@/lib/game/battle";
import { pet } from "@/__tests__/helpers";
import { PET_REGISTRY } from "@/lib/pets";

describe("Skunk", () => {
  it.each([
    { level: 1, effect: "33%", result: "Sloth (1/6)" },
    { level: 2, effect: "66%", result: "Sloth (1/3)" },
    { level: 3, effect: "99%", result: "Sloth (1/1)" },
  ])(
    "reduces the highest-health enemy's health by $effect at level $level, rounded up",
    ({ level, result }) => {
      const { steps } = simulateBattle(
        [pet({ type: "Skunk", attack: 3, health: 5, level })],
        [pet({  health: 10 })],
        PET_REGISTRY
      );

      expect(steps[1].description).toContain(result);
    }
  );

  it("cannot reduce a pet's health below 1", () => {
    const { steps } = simulateBattle(
      [pet({ type: "Skunk", attack: 3, health: 5 })],
      [pet()],
      PET_REGISTRY
    );
    expect(steps[1].description).toContain("Sloth (1/1)");
  });
});
