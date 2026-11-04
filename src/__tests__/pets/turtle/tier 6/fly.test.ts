import { describe, it, expect } from "vitest";
import { simulateBattle } from "@/lib/game/battle";
import { pet, registryWith, staticPet } from "@/__tests__/helpers";
import { PET_REGISTRY } from "@/lib/pets";
import { Trigger } from "@/lib/types";

describe("Fly", () => {
  it.each([
    { level: 1, stats: 4 },
    { level: 2, stats: 8 },
    { level: 3, stats: 12 },
  ])(
    "summons a $stats/$stats Zombie Fly at level $level",
    ({ level, stats }) => {
      const { steps } = simulateBattle(
        [
          pet(),
          pet({ type: "Fly", attack: 4, health: 4, level }),
        ],
        [pet({ attack: 10, health: 100 })],
        PET_REGISTRY
      );

      expect(steps[1].attackerTeam[0]).toMatchObject({
        type: "Zombie Fly",
        attack: stats,
        health: stats,
      });
    }
  );

  it("waits until Rooster's Chick leaves room, then summons a Zombie Fly", () => {
    const { steps } = simulateBattle(
      [
        pet({ type: "Rooster", attack: 6 }),
        pet({ type: "Fly", attack: 4, health: 4 }),
        pet(),
        pet(),
        pet(),
      ],
      [pet({ attack: 10, health: 100 })],
      PET_REGISTRY
    );

    expect(
      steps[1].attackerTeam.some((friend) => friend.type === "Zombie Fly")
    ).toBe(false);
    expect(steps[1].attackerTeam[0].type).toBe("Chick");
    expect(
      steps[2].attackerTeam.filter((friend) => friend.type === "Zombie Fly")
    ).toHaveLength(1);
  });

  it("works at most three times", () => {
    const { steps } = simulateBattle(
      [
        pet(),
        pet(),
        pet(),
        pet(),
        pet({ type: "Fly", attack: 4, health: 100 }),
      ],
      [pet({ attack: 100, health: 1000 })],
      PET_REGISTRY
    );

    // One per fainted Sloth until the limit; a Zombie Fly fainting never
    // activates Fly, and the fourth Sloth gets none.
    expect(
      steps.filter((step) => step.attackerTeam[0]?.type === "Zombie Fly")
    ).toHaveLength(3);
  });

  it("only suppresses Fly when a Zombie Fly faints", () => {
    let listenerTriggers = 0;
    const listener = staticPet("Faint Listener", {
      trigger: Trigger.friend_faints,
      fn: () => listenerTriggers++,
    });
    const { steps } = simulateBattle(
      [
        pet({ type: "Zombie Fly", attack: 4, health: 4 }),
        pet({ type: "Fly", attack: 4, health: 4 }),
        pet({ type: listener.name,  health: 10 }),
      ],
      [pet({ attack: 4, health: 4 })],
      registryWith(listener)
    );

    expect(listenerTriggers).toBe(1);
    expect(
      steps[1].attackerTeam.some((friend) => friend.type === "Zombie Fly")
    ).toBe(false);
  });
});
