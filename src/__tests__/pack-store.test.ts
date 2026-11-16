import { describe, it, expect, vi } from "vitest";
import { Pack } from "@/lib/game/pack";
import { hasRoomForPack, toPackRowData, toSerializedPack } from "@/lib/game/pack-store";
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

  it("can't be read when a saved pet ID no longer exists", () => {
    const row = { name: "My Pack", iconId: 3, petsId: [9999], foodsId: [] };
    expect(() => Pack.fromSerialized(toSerializedPack(row))).toThrow();
  });
});

describe("hasRoomForPack", () => {
  it.each([
    { savedPackCount: 0, expected: true },
    { savedPackCount: 4, expected: true },
    { savedPackCount: 5, expected: false },
  ])("is $expected with $savedPackCount saved packs", ({ savedPackCount, expected }) => {
    expect(hasRoomForPack(savedPackCount)).toBe(expected);
  });
});

describe("Saving packs", () => {
  it("saves a pack that isn't valid yet", () => {
    const incompletePack = Pack.fromSerialized(SAVED_PACK);
    expect(toPackRowData(incompletePack.serialize())).toEqual({ name: "My Pack", iconId: 3, petsId: [1, 2], foodsId: [4] });
  });
});
