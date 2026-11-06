import { describe, it, expect } from "vitest";
import { simulateBattle } from "@/lib/game/battle";
import { pet } from "@/__tests__/helpers";
import { PET_REGISTRY } from "@/lib/pets";

describe("Dolphin", () => {
  it.each([
    { level: 1, result: "Sloth (1/45)" },
    { level: 2, result: "Sloth (1/41)" },
    { level: 3, result: "Sloth (1/37)" },
  ])(
    "deals 4 damage to the lowest-health enemy before combat begins, $level times at level $level",
    ({ level, result }) => {
      const { steps } = simulateBattle(
        [pet({ type: "Dolphin", attack: 4, health: 3, level })],
        [
          pet({  health: 49 }),
          pet({  health: 50 }),
        ],
        PET_REGISTRY
      );

      expect(steps[1].description).toContain(result);
    }
  );

  it("repeats the hit `level` times, re-targeting whichever enemy is currently lowest health", () => {
    const { result } = simulateBattle(
      [pet({ type: "Dolphin",   level: 2 })],
      [
        pet({  health: 4 }),
        pet({  health: 4 }),
      ],
      PET_REGISTRY
    );
    // Level 2 hits the lowest-health enemy twice: the first Sloth dies, then
    // the second (now lowest) is targeted too — both die pre-combat.
    expect(result).toBe("WIN");
  });
});
