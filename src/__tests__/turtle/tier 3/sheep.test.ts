import { describe, it, expect } from "vitest";
import { pet } from "@/__tests__/helpers";
import { Battle } from "@/lib/game/battle";

describe("Sheep", () => {
  it.each([
    { level: 1, result: { type: "Ram", attack: 2, health: 2 } },
    { level: 2, result: { type: "Ram", attack: 4, health: 4 } },
    { level: 3, result: { type: "Ram", attack: 6, health: 6 } },
  ])("summons two $ram at level $level", ({ level, result }) => {
    const { steps } = Battle.fromPetArray({
      playerPets: [pet({ type: "Sheep", level })],
      enemyPets: [pet()],
    });

    expect(steps[1].summary.playerTeam[0]).toMatchObject(result);
    expect(steps[1].summary.playerTeam[1]).toMatchObject(result);
  });

  it("flings the second Ram when the team has room for only one summon", () => {
    const { steps } = Battle.fromPetArray({
      playerPets: [pet({ type: "Sheep" }), pet(), pet(), pet(), pet()],
      enemyPets: [pet()],
    });

    const numberOfRams = steps[1].summary.playerTeam.filter(
      (friend) => friend?.type === "Ram"
    );
    expect(numberOfRams).toHaveLength(1);
    expect(steps[1].summary.playerTeam).toHaveLength(5);
  });
});