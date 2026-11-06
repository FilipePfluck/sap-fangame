import { describe, it, expect } from "vitest";
import { simulateBattle } from "@/lib/game/battle";
import { battleContext, pet } from "@/__tests__/helpers";
import { PET_REGISTRY } from "@/lib/pets";
import { Trigger } from "@/lib/types";

describe("Badger", () => {
  // TODO - Fix a 1/0 Sloth (should have fainted from Badger) successfully attacking opposing team
  it.skip.each([
    { level: 1, ability: "50%", allyHealth: 3 },
    { level: 2, ability: "100%", allyHealth: 6 },
    { level: 3, ability: "150%", allyHealth: 9 },
  ])(
    "deals $ability of attack as damage to adjacent friends ahead and behind on faint at level $level",
    ({ level, allyHealth }) => {
      const friendAhead = pet({ health: allyHealth });
      const friendBehind = pet({ health: allyHealth });
      const { result } = simulateBattle(
        [friendBehind, pet({ type: "Badger", attack: 6, level }), friendAhead],
        [pet({ type: "Dolphin" })],
        PET_REGISTRY
      );

      expect(result).toBe("LOSS");
    }
  );

  it("hits the front enemy when it is at the front of its team", () => {
    const badger = pet({ type: "Badger", attack: 6, health: 0 });
    const enemy = pet({ health: 10 });
    const ability = PET_REGISTRY.Badger.abilities.get(Trigger.faint);
    if (!ability || ability.trigger !== Trigger.faint)
      throw new Error("Expected Badger faint ability");

    ability.fn(battleContext(badger, [badger], [enemy]));

    expect(enemy.health).toBe(7);
  });

  it("skips pending faints", () => {
    const deadFriendAhead = pet({ health: 0 });
    const badger = pet({ type: "Badger", attack: 6, health: 0 });
    const deadFriendBehind = pet({ health: 0 });
    const livingFriendBehind = pet({ health: 10 });
    const deadEnemyFront = pet({  health: 0 });
    const livingEnemyBehind = pet({  health: 10 });
    const team = [
      deadFriendAhead,
      badger,
      deadFriendBehind,
      livingFriendBehind,
    ];
    const ability = PET_REGISTRY.Badger.abilities.get(Trigger.faint);
    if (!ability || ability.trigger !== Trigger.faint)
      throw new Error("Expected Badger faint ability");

    ability.fn(
      battleContext(badger, team, [deadEnemyFront, livingEnemyBehind])
    );

    expect(deadFriendAhead.health).toBe(0);
    expect(deadFriendBehind.health).toBe(0);
    expect(deadEnemyFront.health).toBe(0);
    expect(livingFriendBehind.health).toBe(7);
    expect(livingEnemyBehind.health).toBe(7);
  });
});

