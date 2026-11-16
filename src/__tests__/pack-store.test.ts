import { describe, it, expect, vi } from "vitest";
import { TURTLE_PACK } from "@/lib/game/pack";
import { loadStartingPack, toPackRowData, toSerializedPack } from "@/lib/game/pack-store";
import type { SerializedPack } from "@/lib/types";

const prisma = vi.hoisted(() => ({ pack: { findFirst: vi.fn() } }));
vi.mock("@/lib/prisma", () => ({ prisma }));

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

describe("loadStartingPack", () => {
  // Turtle's 60 pets and three foods per tier, as in pack.test.ts.
  const VALID_ROW = {
    id: 9,
    name: "Full",
    iconId: 1,
    petsId: Array.from({ length: 60 }, (_, index) => index + 1),
    foodsId: [1, 2, 27, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
  };

  it("starts Turtle without a saved pack", async () => {
    expect(await loadStartingPack("user-1", null)).toBe(TURTLE_PACK);
  });

  it("starts a valid saved pack", async () => {
    prisma.pack.findFirst.mockResolvedValue(VALID_ROW);
    expect((await loadStartingPack("user-1", 9))!.data.name).toBe("Full");
  });

  it("won't start a saved pack that isn't valid", async () => {
    prisma.pack.findFirst.mockResolvedValue({ ...VALID_ROW, petsId: [1] });
    expect(await loadStartingPack("user-1", 9)).toBeNull();
  });

  it("won't start someone else's pack", async () => {
    prisma.pack.findFirst.mockResolvedValue(null);
    expect(await loadStartingPack("user-1", 9)).toBeNull();
  });
});
