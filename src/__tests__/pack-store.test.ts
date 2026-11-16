import { describe, it, expect, vi } from "vitest";
import { TURTLE_PACK } from "@/lib/game/pack";
import { getGamePack, toPackRowData, toSerializedPack } from "@/lib/game/pack-store";
import type { SerializedPack } from "@/lib/types";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));

const SAVED_PACK: SerializedPack = {
  name: "My Pack",
  icon: 3,
  pets: [1, 2],
  foods: [4],
  isValid: false,
};

describe("toPackRowData", () => {
  it("stores the pack in the Pack table's columns", () => {
    expect(toPackRowData(SAVED_PACK)).toEqual({ name: "My Pack", iconId: 3, petsId: [1, 2], foodsId: [4] });
  });
});

describe("toSerializedPack", () => {
  it("reads the pack back from the Pack table's columns", () => {
    expect(toSerializedPack({ name: "My Pack", iconId: 3, petsId: [1, 2], foodsId: [4] })).toEqual(SAVED_PACK);
  });
});

describe("getGamePack", () => {
  it("rolls Turtle for a game from before packs", () => {
    expect(getGamePack(null)).toBe(TURTLE_PACK);
  });

  it("finds a static pack by name", () => {
    expect(getGamePack({ ...SAVED_PACK, name: "Turtle" })).toBe(TURTLE_PACK);
  });

  it("rolls the game's custom pack", () => {
    expect(getGamePack(SAVED_PACK).serialize()).toEqual(SAVED_PACK);
  });
});
