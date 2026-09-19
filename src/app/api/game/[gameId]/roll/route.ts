import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getLastBoardState } from "@/lib/game/board";
import { ROLL_COST } from "@/lib/game/costs";
import { generateShop, pickFrozenItems } from "@/lib/game/shop";
import { FrozenPositionsShape } from "@/lib/game/frozen-shape";
import { SHOP_PET_POOL } from "@/lib/pets";
import { SHOP_FOOD_POOL } from "@/lib/foods";
import { z } from "zod";

const RollSchema = z.object(FrozenPositionsShape);

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
  const parsed = RollSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return Response.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  const { frozenPetPositions, frozenFoodPositions } = parsed.data;
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

  if (state.goldRemaining < ROLL_COST) {
    return Response.json({ error: "Not enough gold" }, { status: 400 });
  }

  const { frozenPets, frozenFoods } = pickFrozenItems(state.shop, frozenPetPositions, frozenFoodPositions);

  const newShop = generateShop({
    turn: state.turn.turnNumber,
    pack: SHOP_PET_POOL,
    foodTypes: SHOP_FOOD_POOL,
    frozenPets,
    frozenFoods,
  });

  const boardState = await prisma.boardState.create({
    data: {
      gameId,
      turnId: state.turnId,
      boardState: state.board,
      shopState: newShop,
      goldRemaining: state.goldRemaining - ROLL_COST,
    },
  });

  return Response.json({
    shop: boardState.shopState,
    gold: boardState.goldRemaining,
  });
}
