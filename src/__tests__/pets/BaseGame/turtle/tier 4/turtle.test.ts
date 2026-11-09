import { describe, it, expect } from "vitest";
import { battleContext, pet } from "@/__tests__/helpers";
import { PET_REGISTRY } from "@/lib/pets";
import { Trigger } from "@/lib/types";

describe("Turtle", () => {
  it.each([
    { level: 1, perks: ["Melon", null, null, null] },
    { level: 2, perks: ["Melon", "Melon", null, null] },
    { level: 3, perks: ["Melon", "Melon", "Melon", null] },
  ])(
    "gives Melon to the $level nearest friends behind at level $level",
    ({ level, perks }) => {
      const turtle = pet({ type: "Turtle", attack: 2, health: 0, level });
      const friends = [
        pet({  health: 5 }),
        pet({  health: 5 }),
        pet({  health: 5 }),
        pet({  health: 5 }),
      ];
      const ability = PET_REGISTRY.Turtle.abilities.get(Trigger.faint);
      if (!ability || ability.trigger !== Trigger.faint)
        throw new Error("Expected faint ability");

      ability.fn(battleContext(turtle, [turtle, ...friends], []));

      expect(friends.map((friend) => friend.perk?.name ?? null)).toEqual(perks);
    }
  );

  it("skips pending faints when giving Melon", () => {
    const turtle = pet({ type: "Turtle", attack: 2, health: 0 });
    const deadFriend = pet({  health: 0 });
    const firstFriend = pet({  health: 5 });
    const secondFriend = pet({  health: 5 });
    const ability = PET_REGISTRY.Turtle.abilities.get(Trigger.faint);
    if (!ability || ability.trigger !== Trigger.faint)
      throw new Error("Expected faint ability");

    ability.fn(
      battleContext(turtle, [turtle, deadFriend, firstFriend, secondFriend], [])
    );

    expect(deadFriend.perk).toBeNull();
    expect(firstFriend.perk?.name).toBe("Melon");
  });
});
