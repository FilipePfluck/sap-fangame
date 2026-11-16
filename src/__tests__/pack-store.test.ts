import { describe, it, expect, vi } from "vitest";
import { toPackRowData, toSerializedPack } from "@/lib/game/pack-store";
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
