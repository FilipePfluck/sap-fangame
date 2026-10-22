import { describe, it, expect } from "vitest";
import { Board } from "@/lib/game/board";
import { pet } from "@/__tests__/helpers";

describe("Board.back", () => {
  it("returns the back-most pet by default", () => {
    const board = new Board([pet({ type: "Ant" }), pet({ type: "Fish" }), null]);
    expect(board.back().map((p) => p.type)).toEqual(["Fish"]);
  });

  it("returns the back-most `count` pets in board order", () => {
    const board = new Board([pet({ type: "Ant" }), pet({ type: "Fish" }), pet({ type: "Pig" })]);
    expect(board.back(2).map((p) => p.type)).toEqual(["Fish", "Pig"]);
  });

  it("skips fainted pets", () => {
    const board = new Board([pet({ type: "Ant" }), pet({ type: "Fish", health: 0 })]);
    expect(board.back().map((p) => p.type)).toEqual(["Ant"]);
  });

  it("returns every pet when there are fewer than `count`", () => {
    const board = new Board([pet({ type: "Ant" }), null, null]);
    expect(board.back(3).map((p) => p.type)).toEqual(["Ant"]);
  });
});
