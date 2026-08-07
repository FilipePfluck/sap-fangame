import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getLastBoardState } from "@/lib/game/board";
import { TURTLE_PACK_FOODS } from "@/lib/foods";
import { z } from "zod";
import type { Board, ShopState, PetInstance } from "@/lib/types";

const BuyFoodSchema = z.object({
  shopPosition: z.number().int().min(0).max(4),
  boardPosition: z.number().int().min(0).max(4),
});

const FOOD_MAP = Object.fromEntries(TURTLE_PACK_FOODS.map((f) => [f.name, f]));

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
  const parsed = BuyFoodSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  const { shopPosition, boardPosition } = parsed.data;
  const state = await getLastBoardState(gameId);
  if (!state) {
    return Response.json({ error: "Game state not found" }, { status: 404 });
  }

  if (state.goldRemaining < 3) {
    return Response.json({ error: "Not enough gold" }, { status: 400 });
  }

  const pet = state.board[boardPosition];
  if (!pet) {
    return Response.json({ error: "No pet at board position" }, { status: 400 });
  }

  const shopFood = state.shop.shopFoods[shopPosition];
  if (!shopFood) {
    return Response.json({ error: "Invalid shop position" }, { status: 400 });
  }

  const foodDef = FOOD_MAP[shopFood.type];
  if (!foodDef) {
    return Response.json({ error: "Unknown food type" }, { status: 400 });
  }

  const updatedPet: PetInstance = {
    ...pet,
    attack: pet.attack + (foodDef.effect.attack ?? 0),
    health: pet.health + (foodDef.effect.health ?? 0),
    perk: foodDef.isPerk ? foodDef.name : pet.perk,
  };

  const newBoard: Board = [...state.board];
  newBoard[boardPosition] = updatedPet;

  const newShopFoods = [...state.shop.shopFoods];
  newShopFoods.splice(shopPosition, 1);

  const newShop: ShopState = { shopPets: state.shop.shopPets, shopFoods: newShopFoods };

  const boardState = await prisma.boardState.create({
    data: {
      gameId,
      turnId: state.turnId,
      boardState: newBoard,
      shopState: newShop,
      goldRemaining: state.goldRemaining - 3,
    },
  });

  return Response.json({
    board: boardState.boardState,
    shop: boardState.shopState,
    gold: boardState.goldRemaining,
  });
}
