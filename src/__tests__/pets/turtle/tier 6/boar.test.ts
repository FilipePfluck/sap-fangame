import { describe, it, expect } from "vitest";
import { simulateBattle } from "@/lib/game/battle";
import { pet } from "@/__tests__/helpers";
import { PET_REGISTRY } from "@/lib/pets";

describe("Boar", () => {
  it.each([
    { level: 1, ability: "+4/+2", result: "Boar (14/8)" },
    { level: 2, ability: "+8/+4", result: "Boar (18/10)" },
    { level: 3, ability: "+12/+6", result: "Boar (22/12)" },
  ])("gains $ability before attack at level $level", ({ level, result }) => {
    const { steps } = simulateBattle(
      [pet({ type: "Boar", attack: 10, health: 6, level })],
      [pet({  health: 100 })],
      PET_REGISTRY
    );

    expect(steps[1].description).toContain(result);
  });

  it("retriggers", () => {
    const { steps } = simulateBattle(
      [pet({ type: "Boar", attack: 10, health: 6 })],
      [pet({  health: 100 })],
      PET_REGISTRY
    );

    expect(steps[1].description).toContain("Boar (14/8)");
    expect(steps[2].description).toContain("Boar (18/9)");
    expect(steps[3].description).toContain("Boar (22/10)");
    expect(steps[4].description).toContain("Boar (26/11)");
  });
});
