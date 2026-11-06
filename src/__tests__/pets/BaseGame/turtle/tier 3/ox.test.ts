import { describe, it, expect } from "vitest";
import { simulateBattle } from "@/lib/game/battle";
import { pet } from "@/__tests__/helpers";
import { PET_REGISTRY } from "@/lib/pets";
import { petToString } from "@/lib/utils/flavor-text";
import { HoneyPerk } from "@/lib/perks/honey";
import { Trigger } from "@/lib/types";

describe("Ox", () => {
  it.each([
    { level: 1, result: "Ox (2/1)" },
    { level: 2, result: "Ox (3/1)" },
    { level: 3, result: "Ox (4/1)" },
  ])(
    "gains Melon and +$level attack when its friend ahead faints at level $level",
    ({ level, result }) => {
      const { steps } = simulateBattle(
        [
          pet(),
          pet({ type: "Ox", level }),
        ],
        [pet()],
        PET_REGISTRY
      );

      expect(petToString(steps[1].attackerTeam[0])).toBe(result);
      expect(steps[1].attackerTeam[0].perk?.name).toBe("Melon");
    }
  );

  it("does not trigger when a friend further ahead faints", () => {
    const { steps } = simulateBattle(
      [
        pet(),
        pet(),
        pet({ type: "Ox" }),
      ],
      [pet()],
      PET_REGISTRY
    );

    expect(petToString(steps[1].attackerTeam[1])).toBe("Ox (1/1)");
    expect(steps[1].attackerTeam[1].perk).toBeNull();
  });

  it("works once per turn in battle", () => {
    const { steps } = simulateBattle(
      [
        pet({ perk: HoneyPerk }),
        pet({ type: "Ox" }),
      ],
      [pet(), pet()],
      PET_REGISTRY
    );

    expect(steps[2].attackerTeam.map(petToString)).toEqual(["Ox (2/1)"]);
  });

  it("does not trigger in battle after triggering in the shop that turn", () => {
    const { steps } = simulateBattle(
      [
        pet(),
        pet({
          type: "Ox",
          triggerCountsThisTurn: { [Trigger.friend_ahead_faints]: 1 },
        }),
      ],
      [pet()],
      PET_REGISTRY
    );

    expect(petToString(steps[1].attackerTeam[0])).toBe("Ox (1/1)");
  });
});
