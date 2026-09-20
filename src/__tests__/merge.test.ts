import { describe, it, expect } from "vitest";
import { mergePets, computeLevel, canGainXp, mergeError, levelUpRewardEarned } from "@/lib/game/merge";
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
  it("returns 1 for xp 0–1", () => {
    expect(computeLevel(0)).toBe(1);
    expect(computeLevel(1)).toBe(1);
  });
  it("returns 2 for xp 2–4", () => {
    expect(computeLevel(2)).toBe(2);
    expect(computeLevel(4)).toBe(2);
  });
  it("returns 3 at 5 xp", () => {
    expect(computeLevel(5)).toBe(3);
  });
});

describe("mergePets", () => {
  it("a merge gives both pets' xp plus one", () => {
    const result = mergePets(sloth(0), sloth(0));
    expect(result.xp).toBe(1);
    expect(result.level).toBe(1);
  });

  it("three level-1 pets make a level-2 pet", () => {
    const afterFirstMerge = mergePets(sloth(0), sloth(0)); // xp:1
    const afterSecondMerge = mergePets(afterFirstMerge, sloth(0)); // xp:2
    expect(afterSecondMerge.xp).toBe(2);
    expect(afterSecondMerge.level).toBe(2);
  });

  it("six level-1 pets make a level-3 pet", () => {
    let pet = sloth(0);
    for (let i = 0; i < 5; i++) pet = mergePets(pet, sloth(0));
    expect(pet.xp).toBe(5);
    expect(pet.level).toBe(3);
  });

  it("is symmetric in which pet is source and target", () => {
    expect(mergePets(sloth(0), sloth(2)).xp).toBe(3);
    expect(mergePets(sloth(2), sloth(0)).xp).toBe(3);
  });

  it("caps xp at 5 when two level-2 pets merge", () => {
    const result = mergePets(sloth(4), sloth(4));
    expect(result.xp).toBe(5);
    expect(result.level).toBe(3);
  });

  it("refuses to merge a level-3 pet, in either direction", () => {
    expect(() => mergePets(sloth(5), sloth(0))).toThrow();
    expect(() => mergePets(sloth(0), sloth(5))).toThrow();
  });

  it("refuses to merge different types", () => {
    expect(() => mergePets(sloth(0), { ...sloth(0), type: "Ant" })).toThrow();
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

describe("mergeError", () => {
  it("allows same-type pets below level 3", () => {
    expect(mergeError(sloth(0), sloth(4))).toBeNull();
  });
  it("rejects different types", () => {
    expect(mergeError(sloth(0), { ...sloth(0), type: "Ant" })).not.toBeNull();
  });
  it("rejects any merge involving a level-3 pet", () => {
    expect(mergeError(sloth(5), sloth(0))).toMatch(/level 3/i);
    expect(mergeError(sloth(0), sloth(5))).toMatch(/level 3/i);
  });
});

describe("canGainXp", () => {
  it("is false only once a pet has 5 xp", () => {
    expect(canGainXp(sloth(4))).toBe(true);
    expect(canGainXp(sloth(5))).toBe(false);
  });
});

describe("levelUpRewardEarned", () => {
  it("is earned for any level-up except merging two level-2 pets", () => {
    expect(levelUpRewardEarned(sloth(1), sloth(0))).toBe(true); // L1+L1 -> L2
    expect(levelUpRewardEarned(sloth(4), sloth(0))).toBe(true); // L2+L1 -> L3
    expect(levelUpRewardEarned(sloth(4), sloth(3))).toBe(false); // L2+L2 -> L3
  });
  it("is not earned when the merge doesn't raise the level", () => {
    expect(levelUpRewardEarned(sloth(0), sloth(0))).toBe(false);
    expect(levelUpRewardEarned(sloth(2), sloth(0))).toBe(false); // L2+L1 stays L2
  });
});
