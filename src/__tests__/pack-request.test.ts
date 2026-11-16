import { describe, it, expect } from "vitest";
import { parsePackId, parsePackRequest } from "@/lib/game/pack-request";

const PACK_REQUEST = { name: "My Pack", icon: 3, pets: [1, 2], foods: [4] };

describe("parsePackRequest", () => {
  it("reads a pack that isn't valid yet", () => {
    const packRequest = parsePackRequest(PACK_REQUEST);
    expect("pack" in packRequest && packRequest.pack.serialize()).toEqual({ ...PACK_REQUEST, isValid: false });
  });

  it.each([
    { case: "an unknown pet ID", body: { ...PACK_REQUEST, pets: [9999] }, error: "Unknown pet ID 9999" },
    { case: "a name over 20 characters", body: { ...PACK_REQUEST, name: "a".repeat(21) }, error: "Invalid request" },
    { case: "no body", body: null, error: "Invalid request" },
  ])("rejects $case", ({ body, error }) => {
    expect(parsePackRequest(body)).toEqual({ error });
  });
});

describe("parsePackId", () => {
  it.each([
    { packId: "3", expected: 3 },
    { packId: "0", expected: null },
    { packId: "1.5", expected: null },
    { packId: "abc", expected: null },
  ])("reads $packId as $expected", ({ packId, expected }) => {
    expect(parsePackId(packId)).toBe(expected);
  });
});
