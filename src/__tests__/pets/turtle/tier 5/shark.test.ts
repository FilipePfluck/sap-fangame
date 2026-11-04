import { describe, it, expect } from "vitest";
import { simulateBattle } from "@/lib/game/battle";
import { PET_REGISTRY } from "@/lib/pets";
import { pet } from "@/__tests__/helpers";

describe("Shark", () => {
  it.each([
    { level: 1, stats: 4 },
    { level: 2, stats: 6 },
    { level: 3, stats: 8 },
  ])("gains stats when a friend faints in battle at level $level", ({ level, stats }) => {
    const { steps } = simulateBattle(
      [pet(), pet({ type: "Shark", attack: 2, health: 2, level })],
      [pet({ health: 100 })],
      PET_REGISTRY
    );

    expect(steps[1].attackerTeam[0]).toMatchObject({
      type: "Shark",
      attack: stats,
      health: stats,
    });
  });

  it("gains stats once per friend that faints", () => {
    const { steps } = simulateBattle(
      [pet(), pet(), pet({ type: "Shark", attack: 2, health: 2 })],
      [pet({ health: 100 })],
      PET_REGISTRY
    );

    expect(steps[2].attackerTeam[0]).toMatchObject({ type: "Shark", attack: 6, health: 6 });
  });
});
