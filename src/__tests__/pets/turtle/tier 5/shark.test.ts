import { describe, it, expect } from "vitest";
import { simulateBattle } from "@/lib/game/battle";
import { applyFoodEffect } from "@/lib/game/food";
import { fireShopFaint } from "@/lib/game/shop-ability";
import { PET_REGISTRY } from "@/lib/pets";
import { Pill } from "@/lib/foods";
import { pet } from "@/__tests__/helpers";

describe("Shark", () => {
  it.each([
    { level: 1, stats: 4 },
    { level: 2, stats: 6 },
    { level: 3, stats: 8 },
  ])("gains stats when a friend faints in battle at level $level", ({ level, stats }) => {
    const { steps } = simulateBattle(
      [pet({ type: "Sloth" }), pet({ type: "Shark", attack: 2, health: 2, level })],
      [pet({ type: "Sloth", attack: 1, health: 100 })],
      PET_REGISTRY
    );

    expect(steps[1].attackerTeam[0]).toMatchObject({
      type: "Shark",
      attack: stats,
      health: stats,
    });
  });

  it("gains stats once per friend that faints", () => {
    const { steps } = simulateBattle(
      [pet({ type: "Sloth" }), pet({ type: "Sloth" }), pet({ type: "Shark", attack: 2, health: 2 })],
      [pet({ type: "Sloth", attack: 1, health: 100 })],
      PET_REGISTRY
    );

    expect(steps[2].attackerTeam[0]).toMatchObject({ type: "Shark", attack: 6, health: 6 });
  });

  it("does not react to its own faint", () => {
    const fainted = pet({ type: "Shark", attack: 2, health: 2 });
    const friend = pet({ type: "Shark", attack: 2, health: 2 });

    fireShopFaint([fainted, friend], 0, PET_REGISTRY);

    expect(fainted).toMatchObject({ attack: 2, health: 2 });
    expect(friend).toMatchObject({ attack: 4, health: 4 });
  });

  it("gains stats when a friend is fed a Pill in the shop", () => {
    const result = applyFoodEffect(
      Pill,
      [pet({ type: "Sloth" }), pet({ type: "Shark", attack: 2, health: 2 })],
      0,
      PET_REGISTRY
    );

    expect(result[0]).toBeNull();
    expect(result[1]).toMatchObject({ type: "Shark", attack: 4, health: 4 });
  });
});
