import { describe, it, expect } from "vitest";
import { pet } from "@/__tests__/helpers";
import { Battle } from "@/lib/game/battle";
import { MelonPerk } from "@/lib/perks/melon";

describe("Peacock", () => {
  it.each([
    { level: 1, expectedAttack: 4 },
    { level: 2, expectedAttack: 7 },
    { level: 3, expectedAttack: 10 },
  ])(
    "gains +$expectedAttack attack at level $level from direct damage",
    ({ level, expectedAttack }) => {
      const { steps } = Battle.fromPetArray({
        playerPets: [pet({ type: "Peacock", health: 5, level })],
        enemyPets: [pet()],
      });
      expect(steps[1].summary.playerTeam[0]?.attack).toBe(expectedAttack);
    }
  );

  it("triggers for ability damage", () => {
    const { steps } = Battle.fromPetArray({
      playerPets: [pet({ type: "Mosquito" })],
      enemyPets: [pet({ type: "Peacock", attack: 2, health: 5 })],
    });

    expect(steps[1].summary.opposingTeam[0]?.attack).toBe(8);
  });

  it("does not trigger when damage is fully blocked", () => {
    const { steps } = Battle.fromPetArray({
      playerPets: [pet()],
      enemyPets: [pet({ type: "Peacock", perk: MelonPerk, attack: 2, health: 5 })],
    });

    expect(steps[1].summary.opposingTeam[0]?.attack).toBe(2);
  });

  it("does not trigger when health is removed", () => {
    const { steps } = Battle.fromPetArray({
      playerPets: [pet({ type: "Skunk" })],
      enemyPets: [pet(), pet({ type: "Peacock", attack: 2, health: 5 })],
    });

    expect(steps[1].summary.opposingTeam[0]?.health).toBe(3);
    expect(steps[1].summary.opposingTeam[0]?.attack).toBe(2);
  });
});
