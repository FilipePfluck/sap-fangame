import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getLastBoardState } from "@/lib/game/board";
import { FOOD_REGISTRY } from "@/lib/foods";
import { PET_REGISTRY, SHOP_PET_POOL } from "@/lib/pets";
import { applyFoodEffect, applyFoodLevelUps, feedError } from "@/lib/game/food";
import { applyFrozenFlags } from "@/lib/game/shop";
import { FrozenPositionsShape } from "@/lib/game/frozen-shape";
import { getFoodCost } from "@/lib/game/costs";
import { z } from "zod";
import type { ShopState } from "@/lib/types";

const BuyFoodSchema = z.object({
  shopPosition: z.number().int().min(0).max(9),
  // Omitted for foods that pick their own targets (see needsTarget).
  boardPosition: z.number().int().min(0).max(4).optional(),
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
  const parsed = BuyFoodSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  const { shopPosition, boardPosition, frozenPetPositions, frozenFoodPositions } = parsed.data;
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
  const shopNow = applyFrozenFlags(state.shop, frozenPetPositions, frozenFoodPositions);

  const shopFood = shopNow.shopFoods[shopPosition];
  if (!shopFood) {
    return Response.json({ error: "Invalid shop position" }, { status: 400 });
  }

  const foodDef = FOOD_REGISTRY[shopFood.type];
  if (!foodDef) {
    return Response.json({ error: "Unknown food type" }, { status: 400 });
  }

  const feedProblem = feedError(foodDef, state.board, boardPosition);
  if (feedProblem) {
    return Response.json({ error: feedProblem }, { status: 400 });
  }

  const cost = getFoodCost(shopFood, foodDef);
  if (state.goldRemaining < cost) {
    return Response.json({ error: "Not enough gold" }, { status: 400 });
  }

  const fedBoard = applyFoodEffect(foodDef, state.board, boardPosition, PET_REGISTRY);

  const newShopFoods = [...shopNow.shopFoods];
  newShopFoods.splice(shopPosition, 1);

  const { board: newBoard, shop: newShop, goldDelta } = applyFoodLevelUps(
    foodDef,
    state.board,
    fedBoard,
    { shopPets: shopNow.shopPets, shopFoods: newShopFoods } satisfies ShopState,
    state.turn.turnNumber,
    PET_REGISTRY,
    SHOP_PET_POOL
  );

  const boardState = await prisma.boardState.create({
    data: {
      gameId,
      turnId: state.turnId,
      boardState: newBoard,
      shopState: newShop,
      goldRemaining: state.goldRemaining - cost + goldDelta,
    },
  });

  return Response.json({
    board: boardState.boardState,
    shop: boardState.shopState,
    gold: boardState.goldRemaining,
  });
}
