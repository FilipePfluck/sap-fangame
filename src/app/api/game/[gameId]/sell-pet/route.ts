import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getLastBoardState } from "@/lib/game/board";
import { PET_REGISTRY } from "@/lib/pets";
import { FOOD_REGISTRY } from "@/lib/foods";
import { fireShopAbility } from "@/lib/game/shop-ability";
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

  const body = await request.json().catch(() => null);
  const parsed = SellPetSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  const { boardPosition } = parsed.data;
  const [game, state] = await Promise.all([
    prisma.game.findUnique({ where: { id: gameId } }),
    getLastBoardState(gameId),
  ]);
  if (!game || game.playerId !== session.user.id) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  if (!state) {
    return Response.json({ error: "Game state not found" }, { status: 404 });
  }

  const pet = state.board[boardPosition];
  if (!pet) {
    return Response.json({ error: "No pet at board position" }, { status: 400 });
  }

  const baseGoldGain = pet.level;
  const newBoard: Board = [...state.board];
  newBoard[boardPosition] = null;

  const { board, shop, goldDelta } = fireShopAbility(
    "sell",
    pet,
    boardPosition,
    newBoard,
    state.shop,
    PET_REGISTRY,
    FOOD_REGISTRY,
  );

  const boardState = await prisma.boardState.create({
    data: {
      gameId,
      turnId: state.turnId,
      boardState: board,
      shopState: shop,
      goldRemaining: state.goldRemaining + baseGoldGain + goldDelta,
    },
  });

  return Response.json({
    board: boardState.boardState,
    shop: boardState.shopState,
    gold: boardState.goldRemaining,
  });
}
