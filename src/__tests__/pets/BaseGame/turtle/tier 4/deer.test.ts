import { describe, it, expect } from "vitest";
import { simulateBattle } from "@/lib/game/battle";
import { pet } from "@/__tests__/helpers";
import { PET_REGISTRY } from "@/lib/pets";

describe("Deer", () => {
  it.each([
    { level: 1, attack: 5, health: 3 },
    { level: 2, attack: 10, health: 6 },
    { level: 3, attack: 15, health: 9 },
  ])(
    "summons one $attack/$health Bus with Chili at level $level",
    ({ level, attack, health }) => {
      const { steps } = simulateBattle(
        [
          pet({ type: "Deer", attack: 2, health: 2, level }),
          pet({ type: "Rabbit",  health: 2 }),
        ],
        [
          pet({ attack: 2, health: 100 }),
          pet({ attack: 0, health: 100 }),
        ],
        PET_REGISTRY
      );
      const bus = steps[1].attackerTeam.find((friend) => friend.type === "Bus");

      expect(
        steps[1].attackerTeam.filter((friend) => friend.type === "Bus")
      ).toHaveLength(1);
      expect(bus).toMatchObject({ attack, health, perk: { name: "Chili" } });
      expect(steps[2].defenderTeam[1].health).toBe(95);
    }
  );
});
