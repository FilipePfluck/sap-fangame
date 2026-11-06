import { describe, it, expect } from "vitest";
import { PET_REGISTRY } from "@/lib/pets";
import { ApiBoard } from "@/lib/types";
import { pet } from "@/__tests__/helpers";
import { applyFoodEffect } from "@/lib/game/food";
import { Apple } from "@/lib/foods";

describe("Seal", () => {
  it("buffs friends when Seal eats food", () => {
    const board: ApiBoard = [pet({ type: "Seal" }), pet(), pet()];
    const result = applyFoodEffect(Apple, board, 0, PET_REGISTRY);

    expect(result[1]?.attack).toBe(2);
    expect(result[2]?.attack).toBe(2);
  });

  it("does not buff friends when a friend eats food", () => {
    const board: ApiBoard = [pet({ type: "Seal" }), pet(), pet()];
    const result = applyFoodEffect(Apple, board, 1, PET_REGISTRY);

    expect(result[2]?.attack).toBe(1);
  });
});
