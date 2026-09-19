import { describe, it, expect } from "vitest";
import { orderByAttack } from "@/lib/utils/random";

describe("orderByAttack", () => {
  it("orders entries by descending attack", () => {
    const entries = [{ attack: 3 }, { attack: 10 }, { attack: 1 }];
    const ordered = orderByAttack(entries, (e) => e.attack);
    expect(ordered.map((e) => e.attack)).toEqual([10, 3, 1]);
  });

  it("does not mutate the input array", () => {
    const entries = [{ attack: 1 }, { attack: 5 }];
    orderByAttack(entries, (e) => e.attack);
    expect(entries.map((e) => e.attack)).toEqual([1, 5]);
  });

  it("keeps every entry (equal-attack ties are not dropped)", () => {
    const entries = [{ id: "a", attack: 5 }, { id: "b", attack: 5 }, { id: "c", attack: 5 }];
    const ordered = orderByAttack(entries, (e) => e.attack);
    expect(ordered.map((e) => e.id).sort()).toEqual(["a", "b", "c"]);
  });

  it("randomizes tie order across runs (not always the original order)", () => {
    // With enough equal-attack entries, requiring the exact same order every
    // run for many runs would be statistically ~impossible if ties were
    // truly randomized; this guards against a non-random "stable" fallback.
    const entries = Array.from({ length: 8 }, (_, i) => ({ id: i, attack: 1 }));
    const firstOrder = orderByAttack(entries, (e) => e.attack).map((e) => e.id);
    let sawDifferentOrder = false;
    for (let i = 0; i < 20; i++) {
      const order = orderByAttack(entries, (e) => e.attack).map((e) => e.id);
      if (order.join(",") !== firstOrder.join(",")) {
        sawDifferentOrder = true;
        break;
      }
    }
    expect(sawDifferentOrder).toBe(true);
  });
});
