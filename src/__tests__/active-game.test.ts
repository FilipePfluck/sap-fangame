import { describe, it, expect, vi, beforeEach } from "vitest";
import { deleteActiveGame } from "@/lib/game/active-game";

// Each delete returns its table's name, so the transaction records the order.
const prisma = vi.hoisted(() => ({
  game: { findFirst: vi.fn(), delete: vi.fn(() => "Game") },
  boardState: { deleteMany: vi.fn(() => "BoardState") },
  battle: { deleteMany: vi.fn(() => "Battle") },
  gameTurn: { deleteMany: vi.fn(() => "GameTurn") },
  $transaction: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({ prisma }));

beforeEach(() => vi.clearAllMocks());

describe("deleteActiveGame", () => {
  it("only looks for the user's own active game", async () => {
    prisma.game.findFirst.mockResolvedValue(null);
    await deleteActiveGame("user-1", "game-1");
    expect(prisma.game.findFirst).toHaveBeenCalledWith({ where: { id: "game-1", playerId: "user-1", status: "ACTIVE" } });
  });

  it("deletes nothing when the game isn't the user's active game", async () => {
    prisma.game.findFirst.mockResolvedValue(null);
    await deleteActiveGame("user-1", "game-1");
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("deletes board states, battles and turns before the game", async () => {
    prisma.game.findFirst.mockResolvedValue({ id: "game-1" });
    await deleteActiveGame("user-1", "game-1");
    expect(prisma.$transaction).toHaveBeenCalledWith(["BoardState", "Battle", "GameTurn", "Game"]);
  });
});
