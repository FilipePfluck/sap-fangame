import { describe, it, expect } from "vitest";
import { battleContext, pet } from "@/__tests__/helpers";
import { PET_REGISTRY } from "@/lib/pets";
import { Trigger } from "@/lib/types";

describe("Mammoth", () => {
  it("buffs living friends but not itself or pending faints", () => {
    const mammoth = pet({ type: "Mammoth", attack: 4, health: 0 });
    const deadFriend = pet({  health: 0 });
    const livingFriend = pet({  health: 10 });
    const ability = PET_REGISTRY.Mammoth.abilities.get(Trigger.faint);
    if (!ability || ability.trigger !== Trigger.faint)
      throw new Error("Expected faint ability");

    ability.fn(battleContext(mammoth, [mammoth, deadFriend, livingFriend], []));

    expect(mammoth.health).toBe(0);
    expect(deadFriend.health).toBe(0);
    expect(livingFriend).toMatchObject({ attack: 3, health: 12 });
  });
});
