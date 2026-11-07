import { describe, it, expect } from "vitest";
import { battleContext, pet } from "@/__tests__/helpers";
import { PET_REGISTRY } from "@/lib/pets";
import { Trigger } from "@/lib/types";
import { petToString } from "@/lib/utils/flavor-text";

describe("Flamingo", () => {
  it.each([
    {
      level: 1,
      expected: ["Sloth (2/2)", "Sloth (2/2)", "Sloth (1/1)", "Sloth (1/1)"],
    },
    {
      level: 2,
      expected: ["Sloth (3/3)", "Sloth (3/3)", "Sloth (1/1)", "Sloth (1/1)"],
    },
    {
      level: 3,
      expected: ["Sloth (4/4)", "Sloth (4/4)", "Sloth (1/1)", "Sloth (1/1)"],
    },
  ])(
    "gives the two nearest friends behind +$level/+$level at level $level",
    ({ level, expected }) => {
      const flamingo = pet({ type: "Flamingo", attack: 3, health: 0, level });
      const friends = [pet(), pet(), pet(), pet()];
      const ability = PET_REGISTRY.Flamingo.abilities.get(Trigger.faint);
      if (!ability || ability.trigger !== Trigger.faint)
        throw new Error("Expected faint ability");

      ability.fn(battleContext(flamingo, [flamingo, ...friends], []));

      expect(friends.map(petToString)).toEqual(expected);
    }
  );

  it("skips pending faints and buffs the nearest living friends behind", () => {
    const flamingo = pet({ type: "Flamingo", attack: 3, health: 0 });
    const deadFriend = pet({ health: 0 });
    const firstFriend = pet();
    const secondFriend = pet();
    const thirdFriend = pet();
    const team = [flamingo, deadFriend, firstFriend, secondFriend, thirdFriend];
    const ability = PET_REGISTRY.Flamingo.abilities.get(Trigger.faint);
    if (!ability || ability.trigger !== Trigger.faint)
      throw new Error("Expected faint ability");

    ability.fn(battleContext(flamingo, team, []));

    expect(deadFriend).toMatchObject({ attack: 1, health: 0 });
    expect(firstFriend).toMatchObject({ attack: 2, health: 2 });
    expect(secondFriend).toMatchObject({ attack: 2, health: 2 });
    expect(thirdFriend).toMatchObject({ attack: 1, health: 1 });
  });
});
