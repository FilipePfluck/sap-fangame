import { describe, it, expect } from "vitest";
import { MatchmakingMode, PackKind, getPackKind, isMatchmakingMode, opponentPackKinds } from "@/lib/game/matchmaking";
import { Pack, TURTLE_PACK } from "@/lib/game/pack";

describe("opponentPackKinds", () => {
  it.each([
    { packKind: PackKind.Static, matchmakingMode: MatchmakingMode.SamePack, expected: ["STATIC"] },
    { packKind: PackKind.Custom, matchmakingMode: MatchmakingMode.SamePack, expected: ["CUSTOM"] },
    { packKind: PackKind.Static, matchmakingMode: MatchmakingMode.AllPacks, expected: ["STATIC", "CUSTOM"] },
    { packKind: PackKind.Custom, matchmakingMode: MatchmakingMode.AllPacks, expected: ["STATIC", "CUSTOM"] },
  ])("matches a $packKind pack on $matchmakingMode against $expected packs", ({ packKind, matchmakingMode, expected }) => {
    expect(opponentPackKinds(packKind, matchmakingMode)).toEqual(expected);
  });
});

describe("getPackKind", () => {
  it("calls Turtle a static pack", () => {
    expect(getPackKind(TURTLE_PACK)).toBe("STATIC");
  });

  it("calls a saved pack a custom pack", () => {
    const pack = Pack.fromSerialized({ name: "Zoo", icon: 1, pets: [1], foods: [], isValid: false });
    expect(getPackKind(pack)).toBe("CUSTOM");
  });
});

describe("isMatchmakingMode", () => {
  it.each([
    { value: "SAME_PACK", expected: true },
    { value: "ALL_PACKS", expected: true },
    { value: "ANY", expected: false },
    { value: 0, expected: false },
  ])("is $expected for $value", ({ value, expected }) => {
    expect(isMatchmakingMode(value)).toBe(expected);
  });
});
