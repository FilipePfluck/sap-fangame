import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getLastBoardState } from "@/lib/game/board";
import { mergePets } from "@/lib/game/merge";
import { z } from "zod";
import type { Board } from "@/lib/types";

const MergeSchema = z.object({
  from: z.number().int().min(0).max(4),
  to: z.number().int().min(0).max(4),
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
  const parsed = MergeSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  const { from, to } = parsed.data;

  if (from === to) {
    return Response.json({ error: "Source and target are the same" }, { status: 400 });
  }

  const state = await getLastBoardState(gameId);
  if (!state) {
    return Response.json({ error: "Game state not found" }, { status: 404 });
  }

  const petFrom = state.board[from];
  const petTo = state.board[to];

  if (!petFrom) {
    return Response.json({ error: "No pet at source position" }, { status: 400 });
  }
  if (!petTo) {
    return Response.json({ error: "No pet at target position" }, { status: 400 });
  }
  if (petFrom.type !== petTo.type) {
    return Response.json({ error: "Pets must be the same type to merge" }, { status: 400 });
  }

  const merged = mergePets(petFrom, petTo);
  const newBoard: Board = [...state.board];
  newBoard[to] = merged;
  newBoard[from] = null;

  const boardState = await prisma.boardState.create({
    data: {
      gameId,
      turnId: state.turnId,
      boardState: newBoard,
      shopState: state.shop,
      goldRemaining: state.goldRemaining,
    },
  });

  return Response.json({
    board: boardState.boardState,
    shop: boardState.shopState,
    gold: boardState.goldRemaining,
  });
}
