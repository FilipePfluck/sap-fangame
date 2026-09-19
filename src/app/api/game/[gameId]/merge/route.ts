import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getLastBoardState } from "@/lib/game/board";
import { mergePets, levelUpRewardEarned } from "@/lib/game/merge";
import { addLevelUpReward, applyFrozenFlags } from "@/lib/game/shop";
import { FrozenPositionsShape } from "@/lib/game/frozen-shape";
import { PET_REGISTRY, SHOP_PET_POOL } from "@/lib/pets";
import { fireShopAbility } from "@/lib/game/shop-ability";
import { z } from "zod";
import type { Board, ShopState } from "@/lib/types";

const MergeSchema = z.object({
  from: z.number().int().min(0).max(4),
  to: z.number().int().min(0).max(4),
  ...FrozenPositionsShape,
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
  const parsed = MergeSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  const { from, to, frozenPetPositions, frozenFoodPositions } = parsed.data;

  if (from === to) {
    return Response.json({ error: "Source and target are the same" }, { status: 400 });
  }

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

  const preMergeLevel = petTo.level;
  const merged = mergePets(petFrom, petTo);
  const didLevelUp = merged.level > preMergeLevel;

  let currentBoard: Board = [...state.board];
  currentBoard[to] = merged;
  currentBoard[from] = null;
  let currentShop: ShopState = applyFrozenFlags(state.shop, frozenPetPositions, frozenFoodPositions);
  let extraGold = 0;

  if (didLevelUp) {
    const petAtOldLevel = { ...merged, level: preMergeLevel };
    const result = fireShopAbility("level-up", petAtOldLevel, to, currentBoard, currentShop, PET_REGISTRY);
    currentBoard = result.board;
    currentShop = result.shop;
    extraGold = result.goldDelta;
  }

  if (levelUpRewardEarned(petFrom, petTo)) {
    currentShop = addLevelUpReward(currentShop, state.turn.turnNumber, SHOP_PET_POOL);
  }

  const boardState = await prisma.boardState.create({
    data: {
      gameId,
      turnId: state.turnId,
      boardState: currentBoard,
      shopState: currentShop,
      goldRemaining: state.goldRemaining + extraGold,
    },
  });

  return Response.json({
    board: boardState.boardState,
    shop: boardState.shopState,
    gold: boardState.goldRemaining,
  });
}
