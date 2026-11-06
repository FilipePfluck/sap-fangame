import { describe, it, expect } from "vitest";
import { simulateBattle } from "@/lib/game/battle";
import { pet } from "@/__tests__/helpers";
import { PET_REGISTRY } from "@/lib/pets";
import { petToString } from "@/lib/utils/flavor-text";

describe("Hippo", () => {
  it.each([
    { level: 1, ability: "+3/+3", result: "Hippo (7/9)" },
    { level: 2, ability: "+6/+6", result: "Hippo (10/12)" },
    { level: 3, ability: "+9/+9", result: "Hippo (13/15)" },
  ])("gains $ability per knock-out at level $level", ({ level, result }) => {
    const { steps } = simulateBattle(
      [pet({ type: "Hippo", attack: 4, health: 7, level })],
      [pet()],
      PET_REGISTRY
    );

    expect(petToString(steps[1].attackerTeam[0])).toBe(result);
  });

  it("is capped at 3 triggers per battle", () => {
    const { steps } = simulateBattle(
      [pet({ type: "Hippo", attack: 4, health: 7 })],
      [
        pet(),
        pet(),
        pet(),
        pet(),
        pet(),
      ],
      PET_REGISTRY
    );

    const lastStep = steps[steps.length - 1];
    expect(petToString(lastStep.attackerTeam[0])).toContain("Hippo (13/11)");
  });
});
