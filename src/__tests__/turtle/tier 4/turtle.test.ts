import { describe, it, expect } from "vitest";
import { pet } from "@/__tests__/helpers";
import { Battle } from "@/lib/game/battle";

describe("Turtle", () => {
  it.each([
    { level: 1, perks: ["Melon", null, null, null] },
    { level: 2, perks: ["Melon", "Melon", null, null] },
    { level: 3, perks: ["Melon", "Melon", "Melon", null] },
  ])(
    "gives Melon to the $level nearest friends behind at level $level",
    ({ level, perks }) => {
      const { steps } = Battle.fromPetArray({
        playerPets: [pet({ type: "Turtle", level }), pet(), pet(), pet(), pet()],
        enemyPets: [pet()],
      })

      expect(
        steps[1].summary.playerTeam.map((friend) => friend?.perk?.name ?? null)
      ).toEqual(perks);
    }
  );

  it("skips pending faints when giving Melon", () => {
    const turtle = pet({ type: "Turtle", health: 0 });
    const deadFriend = pet({ health: 0 });
    const firstFriend = pet();
    const secondFriend = pet();

    expect(deadFriend.perk).toBeNull();
    expect(firstFriend.perk?.name).toBe("Melon");
  });
});