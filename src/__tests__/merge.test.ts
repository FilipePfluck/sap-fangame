import { describe, it, expect } from "vitest";
import { mergePets, computeLevel } from "@/lib/game/merge";
import { createPet } from "@/lib/game/pet";
import { PET_REGISTRY } from "@/lib/pets";
import type { PetInstance } from "@/lib/types";

const sloth = (xp: number): PetInstance => ({
  type: "Sloth",
  attack: 1,
  health: 1,
  perk: null,
  xp,
  level: computeLevel(xp),
});

describe("computeLevel", () => {
  it("returns 1 for xp below 2", () => {
    expect(computeLevel(0)).toBe(1);
    expect(computeLevel(1)).toBe(1);
  });
  it("returns 2 for xp 2–4", () => {
    expect(computeLevel(2)).toBe(2);
    expect(computeLevel(4)).toBe(2);
  });
  it("returns 3 for xp 5 and above", () => {
    expect(computeLevel(5)).toBe(3);
    expect(computeLevel(6)).toBe(3);
  });
  it("creates new pets with 0 XP", () => {
    expect(createPet(PET_REGISTRY.Sloth).xp).toBe(0);
  });
});

describe("mergePets", () => {
  it("adds one XP when merging two fresh pets", () => {
    const result = mergePets(sloth(0), sloth(0));
    expect(result.xp).toBe(1);
    expect(result.level).toBe(1);
  });

  it("accumulates xp correctly after a second merge", () => {
    // Each merged copy adds one XP: two merges reach level 2 at 2 XP.
    const afterFirstMerge = mergePets(sloth(0), sloth(0)); // xp:1
    const afterSecondMerge = mergePets(afterFirstMerge, sloth(0)); // xp:2
    expect(afterSecondMerge.xp).toBe(2);
    expect(afterSecondMerge.level).toBe(2);
  });

  it("board merge: accumulated pet into fresh pet gains correct xp", () => {
    const accumulated = sloth(1);
    const fresh = sloth(0);
    const result = mergePets(fresh, accumulated);
    expect(result.xp).toBe(2);
    expect(result.level).toBe(2);
  });

  it("board merge: fresh pet into accumulated pet gains correct xp", () => {
    const accumulated = sloth(1);
    const fresh = sloth(0);
    const result = mergePets(accumulated, fresh);
    expect(result.xp).toBe(2);
    expect(result.level).toBe(2);
  });

  it("caps merged XP at 5", () => {
    expect(mergePets(sloth(5), sloth(0)).xp).toBe(5);
  });

  it("boosts attack and health by 1 over the max of both", () => {
    const a: PetInstance = { type: "Sloth", attack: 3, health: 2, perk: null, xp: 0, level: 1 };
    const b: PetInstance = { type: "Sloth", attack: 1, health: 4, perk: null, xp: 0, level: 1 };
    const result = mergePets(a, b);
    expect(result.attack).toBe(4); // max(3,1)+1
    expect(result.health).toBe(5); // max(2,4)+1
  });
});

describe("mergePets — temporary stats", () => {
  it("keeps temp attack on the merged pet so it is still removed next turn", () => {
    const buffed: PetInstance = { ...sloth(0), attack: 3, tempAttack: 2 };
    const merged = mergePets(buffed, sloth(0));
    expect(merged.attack).toBe(4);
    expect(merged.tempAttack).toBe(2);
  });

  it("adds no temp fields when neither pet had any", () => {
    const merged = mergePets(sloth(0), sloth(0));
    expect(merged.tempAttack).toBeUndefined();
    expect(merged.tempHealth).toBeUndefined();
  });
});
