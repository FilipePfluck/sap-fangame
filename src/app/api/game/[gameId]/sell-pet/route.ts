import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getLastBoardState } from "@/lib/game/board";
import { z } from "zod";
import type { Board } from "@/lib/types";

const SellPetSchema = z.object({
  boardPosition: z.number().int().min(0).max(4),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { gameId } = await params;

  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game || game.playerId !== session.user.id) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = SellPetSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  const { boardPosition } = parsed.data;
  const state = await getLastBoardState(gameId);
  if (!state) {
    return Response.json({ error: "Game state not found" }, { status: 404 });
  }

  const pet = state.board[boardPosition];
  if (!pet) {
    return Response.json({ error: "No pet at board position" }, { status: 400 });
  }

  const goldGain = pet.level;
  const newBoard: Board = [...state.board];
  newBoard[boardPosition] = null;

  const boardState = await prisma.boardState.create({
    data: {
      gameId,
      turnId: state.turnId,
      boardState: newBoard,
      shopState: state.shop,
      goldRemaining: state.goldRemaining + goldGain,
    },
  });

  return Response.json({
    board: boardState.boardState,
    gold: boardState.goldRemaining,
  });
}
