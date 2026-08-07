import { prisma } from "@/lib/prisma";
import type { Board, ShopState } from "@/lib/types";

export type ResolvedBoardState = {
  id: string;
  gameId: string;
  turnId: string;
  board: Board;
  shop: ShopState;
  goldRemaining: number;
  turn: {
    id: string;
    turnNumber: number;
    lives: number;
    trophies: number;
  };
};

export async function getLastBoardState(
  gameId: string
): Promise<ResolvedBoardState | null> {
  const boardState = await prisma.boardState.findFirst({
    where: { gameId },
    orderBy: { createdAt: "desc" },
    include: { turn: true },
  });

  if (!boardState) return null;

  return {
    id: boardState.id,
    gameId: boardState.gameId,
    turnId: boardState.turnId,
    board: boardState.boardState as Board,
    shop: boardState.shopState as ShopState,
    goldRemaining: boardState.goldRemaining,
    turn: {
      id: boardState.turn.id,
      turnNumber: boardState.turn.turnNumber,
      lives: boardState.turn.lives,
      trophies: boardState.turn.trophies,
    },
  };
}
