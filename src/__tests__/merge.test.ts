import { describe, it, expect } from "vitest";
import { mergePets, computeLevel } from "@/lib/game/merge";
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
  it("returns 1 for xp < 3", () => {
    expect(computeLevel(1)).toBe(1);
    expect(computeLevel(2)).toBe(1);
  });
  it("returns 2 for xp 3–5", () => {
    expect(computeLevel(3)).toBe(2);
    expect(computeLevel(5)).toBe(2);
  });
  it("returns 3 for xp >= 6", () => {
    expect(computeLevel(6)).toBe(3);
  });
});

describe("mergePets", () => {
  it("combines xp of both pets on first merge", () => {
    const result = mergePets(sloth(1), sloth(1));
    expect(result.xp).toBe(2);
    expect(result.level).toBe(1);
  });

  it("accumulates xp correctly after a second merge", () => {
    // Simulates: buy pet → board has xp:1, buy same type → auto-merge → xp:2
    // Then buy same type again → xp:3 → level 2
    const afterFirstMerge = mergePets(sloth(1), sloth(1)); // xp:2
    const afterSecondMerge = mergePets(afterFirstMerge, sloth(1)); // xp:3
    expect(afterSecondMerge.xp).toBe(3);
    expect(afterSecondMerge.level).toBe(2);
  });

  it("board merge: accumulated pet into fresh pet gains correct xp", () => {
    const accumulated = sloth(2); // pet that was already merged once
    const fresh = sloth(1);
    const result = mergePets(fresh, accumulated); // fresh is petFrom (selected), accumulated is petTo (target)
    expect(result.xp).toBe(3);
    expect(result.level).toBe(2);
  });

  it("board merge: fresh pet into accumulated pet gains correct xp", () => {
    const accumulated = sloth(2);
    const fresh = sloth(1);
    const result = mergePets(accumulated, fresh); // accumulated is petFrom, fresh is petTo
    expect(result.xp).toBe(3);
    expect(result.level).toBe(2);
  });

  it("boosts attack and health by 1 over the max of both", () => {
    const a: PetInstance = { type: "Sloth", attack: 3, health: 2, perk: null, xp: 1, level: 1 };
    const b: PetInstance = { type: "Sloth", attack: 1, health: 4, perk: null, xp: 1, level: 1 };
    const result = mergePets(a, b);
    expect(result.attack).toBe(4); // max(3,1)+1
    expect(result.health).toBe(5); // max(2,4)+1
  });
});
