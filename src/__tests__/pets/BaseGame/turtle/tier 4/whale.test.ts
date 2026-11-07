import { describe, it, expect } from "vitest";
import { pet, registryWith, staticPet } from "@/__tests__/helpers";
import { Trigger } from "@/lib/types";
import { MelonPerk } from "@/lib/perks/melon";
import { simulateBattle } from "@/lib/game/battle";
import { getMinimumXpFor } from "@/lib/game/board";
import { grantExperience } from "@/lib/game/merge";
import { PET_REGISTRY } from "@/lib/pets";

describe("Whale", () => {
  it.each([{ level: 1 }, { level: 2 }, { level: 3 }])(
    "releases the nearest friend ahead at Whale level $level without its perk",
    ({ level }) => {
      let faintTriggers = 0;
      const swallowTarget = staticPet("Swallow Target", {
        trigger: Trigger.faint,
        fn: () => faintTriggers++,
      });
      const swallowed = pet({
        type: "Swallow Target",
        attack: 9,
        health: 1000,
        perk: MelonPerk,
      });
      const { steps } = simulateBattle(
        [
          pet(),
          swallowed,
          pet({ type: "Whale", attack: 3, health: 7, level }),
        ],
        [pet({ attack: 10, health: 1000 })],
        registryWith(swallowTarget)
      );

      expect(steps[1].attackerTeam.map((friend) => friend.type)).toEqual([
        "Whale",
      ]);
      expect(steps[2].attackerTeam[0]).toMatchObject({
        type: "Swallow Target",
        attack: 9,
        health: 1000,
        perk: null,
        level,
        xp: getMinimumXpFor(level),
      });
      expect(faintTriggers).toBe(0);
    }
  );

  it("releases at the level Whale swallowed at, not the level it faints at", () => {
    const leveler = staticPet("Whale Leveler", {
      trigger: Trigger.start_of_battle,
      fn: (ctx) => {
        const whale = ctx.team.find((friend) => friend.type === "Whale");
        if (whale) grantExperience(whale, 5);
      },
    });
    const { steps } = simulateBattle(
      [
        pet({  health: 50 }),
        pet({ type: "Whale", attack: 3, health: 7 }),
        pet({ type: leveler.name,  health: 50 }),
      ],
      [pet({ attack: 6, health: 1000 })],
      registryWith(leveler)
    );

    expect(steps[0].attackerTeam[1].level).toBe(1);
    expect(steps[1].attackerTeam[0]).toMatchObject({ type: "Whale", level: 3 });
    expect(steps[2].attackerTeam[0]).toMatchObject({
      type: "Sloth",
      level: 1,
      xp: 0,
    });
  });

  it("does not swallow the friend behind when there is no friend ahead", () => {
    const { steps } = simulateBattle(
      [
        pet({ type: "Whale", attack: 3, health: 7 }),
        pet({ type: "Cricket",  health: 1 }),
      ],
      [pet({  health: 1000 })],
      PET_REGISTRY
    );

    expect(steps[1].attackerTeam.map((friend) => friend.type)).toEqual([
      "Whale",
      "Cricket",
    ]);
    expect(steps[1].attackerTeam[0].swallowedPets).toBeUndefined();
  });

  it("swallows and releases a second friend, at level 1, with a level 1 Tiger behind", () => {
    const { steps } = simulateBattle(
      [
        pet({ type: "Ant", attack: 2, health: 2 }),
        pet({ type: "Fish", attack: 2, health: 3 }),
        pet({ type: "Whale", attack: 3, health: 7, level: 2 }),
        pet({ type: "Tiger",  health: 50 }),
      ],
      [pet({ attack: 100, health: 1000 })],
      registryWith()
    );

    expect(steps[1].attackerTeam.slice(0, 2)).toMatchObject([
      { type: "Fish", level: 2 },
      { type: "Ant", level: 1 },
    ]);
  });
});
