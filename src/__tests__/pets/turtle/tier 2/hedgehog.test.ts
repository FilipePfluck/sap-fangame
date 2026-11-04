import { describe, it, expect } from "vitest";
import { battleContext, pet } from "@/__tests__/helpers";
import { PET_REGISTRY } from "@/lib/pets";
import { Trigger } from "@/lib/types";

describe("Hedgehog", () => {
  it.each([
    { level: 1, damage: 2, expectedHealth: 8 },
    { level: 2, damage: 4, expectedHealth: 6 },
    { level: 3, damage: 6, expectedHealth: 4 },
  ])(
    "deals $damage damage to every living pet on both teams at level $level",
    ({ level, expectedHealth }) => {
      const hedgehog = pet({ type: "Hedgehog", attack: 4, health: 0, level });
      const livingFriend = pet({ health: 10 });
      const deadFriend = pet({ health: 0 });
      const enemy = pet({ health: 10 });
      const ability = PET_REGISTRY.Hedgehog.abilities.get(Trigger.faint);
      if (!ability || ability.trigger !== Trigger.faint)
        throw new Error("Expected faint ability");

      ability.fn(
        battleContext(hedgehog, [hedgehog, livingFriend, deadFriend], [enemy])
      );

      expect(livingFriend.health).toBe(expectedHealth);
      expect(deadFriend.health).toBe(0);
      expect(enemy.health).toBe(expectedHealth);
    }
  );
});
