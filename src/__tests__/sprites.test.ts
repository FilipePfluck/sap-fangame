import { describe, it, expect } from "vitest";
import { existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";
import { PET_REGISTRY } from "@/lib/pets";
import { FOOD_REGISTRY } from "@/lib/foods";

const spriteDir = join(process.cwd(), "public", "sap");
const onDisk = new Set(readdirSync(spriteDir));

const entries = [
  ...Object.values(PET_REGISTRY).map((p) => ({ name: p.name, sprite: p.sprite })),
  ...Object.values(FOOD_REGISTRY).map((f) => ({ name: f.name, sprite: f.sprite })),
];

describe("sprites", () => {
  it.each(entries)("$name sprite exists with exact-case path", ({ sprite }) => {
    expect(sprite.startsWith("/sap/")).toBe(true);
    // Set lookup is case-sensitive, unlike existsSync on macOS.
    expect(onDisk.has(sprite.slice("/sap/".length))).toBe(true);
  });

  it.each(entries)("$name sprite is a real WebP", ({ sprite }) => {
    const bytes = readFileSync(join(process.cwd(), "public", sprite));
    expect(bytes.subarray(0, 4).toString()).toBe("RIFF");
    expect(bytes.subarray(8, 12).toString()).toBe("WEBP");
  });

  it("has no orphaned sprite files", () => {
    const used = new Set(entries.map((e) => e.sprite.slice("/sap/".length)));
    const orphans = [...onDisk].filter((f) => f.endsWith(".webp") && !used.has(f));
    expect(orphans).toEqual([]);
  });
});
