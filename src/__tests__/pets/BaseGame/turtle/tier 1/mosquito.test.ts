import { describe, it, expect } from "vitest";
import { simulateBattle } from "@/lib/game/battle";
import { pet } from "@/__tests__/helpers";
import { PET_REGISTRY } from "@/lib/pets";

describe("Mosquito", () => {
  it.each([
    { level: 1, expected: "LOSS" },
    { level: 2, expected: "DRAW" },
    { level: 3, expected: "WIN" },
  ])(
    "deals 1 random damage to $level random enemy at level $level at start of battle",
    ({ level, expected }) => {
      const { result } = simulateBattle(
        [pet({ type: "Mosquito", attack: 2, health: 2, level })],
        [
          pet({ attack: 2 }),
          pet({ attack: 2 }),
          pet({ attack: 2 }),
        ],
        PET_REGISTRY
      );

      expect(result).toBe(expected);
    }
  );
});
