import { describe, it, expect } from "vitest";
import { simulateBattle } from "@/lib/game/battle";
import { pet } from "@/__tests__/helpers";
import { PET_REGISTRY } from "@/lib/pets";
import { petToString } from "@/lib/utils/flavor-text";

describe("Sheep", () => {
  it.each([
    { level: 1, ram: "Ram (2/2)" },
    { level: 2, ram: "Ram (4/4)" },
    { level: 3, ram: "Ram (6/6)" },
  ])("summons two $ram at level $level", ({ level, ram }) => {
    const { steps } = simulateBattle(
      [pet({ type: "Sheep", attack: 2, health: 2, level })],
      [pet({ attack: 2, health: 2 })],
      PET_REGISTRY
    );

    expect(steps[1].attackerTeam.map(petToString)).toEqual([ram, ram]);
  });

  it("flings the second Ram when the team has room for only one summon", () => {
    const { steps } = simulateBattle(
      [
        pet({ type: "Sheep", attack: 2}),
        pet({  health: 10 }),
        pet({  health: 10 }),
        pet({  health: 10 }),
        pet({  health: 10 }),
      ],
      [pet({ attack: 2, health: 10 })],
      PET_REGISTRY
    );

    expect(
      steps[1].attackerTeam.filter((friend) => friend.type === "Ram")
    ).toHaveLength(1);
    expect(steps[1].attackerTeam).toHaveLength(5);
  });
});
