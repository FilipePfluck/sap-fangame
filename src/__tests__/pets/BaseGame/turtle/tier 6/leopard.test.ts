import { describe, it, expect } from "vitest";
import { simulateBattle } from "@/lib/game/battle";
import { pet } from "@/__tests__/helpers";
import { PET_REGISTRY } from "@/lib/pets";

describe("Leopard", () => {
  it.each([
    { level: 1, expected: "LOSS" },
    { level: 2, expected: "DRAW" },
    { level: 3, expected: "WIN" },
  ])("snipes $level pets at level $level", ({ level, expected }) => {
    const { result } = simulateBattle(
      [pet({ type: "Leopard", attack: 2, health: 2, level })],
      [
        pet({ attack: 2 }),
        pet({ attack: 2 }),
        pet({ attack: 2 }),
      ],
      PET_REGISTRY
    );

    expect(result).toBe(expected);
  });

  it("snipes deal 50% of attack damage", () => {
    const { steps } = simulateBattle(
      [pet({ type: "Leopard", attack: 10, health: 4 })],
      [pet({  health: 10 })],
      PET_REGISTRY
    );

    expect(steps[1].description).toContain("Sloth (1/5)");
  });
});

