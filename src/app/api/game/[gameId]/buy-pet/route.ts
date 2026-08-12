import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getLastBoardState } from "@/lib/game/board";
import { TURTLE_PACK_PETS } from "@/lib/pets";
import { mergePets, openSlot } from "@/lib/game/merge";
import { z } from "zod";
import type { Board, PetInstance, ShopState } from "@/lib/types";

const BuyPetSchema = z.object({
  shopPosition: z.number().int().min(0).max(4),
  boardPosition: z.number().int().min(0).max(4),
});

const PET_MAP = Object.fromEntries(TURTLE_PACK_PETS.map((p) => [p.name, p]));

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
  const parsed = BuyPetSchema.safeParse(body);
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

  const shopPet = state.shop.shopPets[shopPosition];
  if (!shopPet) {
    return Response.json({ error: "Invalid shop position" }, { status: 400 });
  }

  const petDef = PET_MAP[shopPet.type];
  if (!petDef) {
    return Response.json({ error: "Unknown pet type" }, { status: 400 });
  }

  const freshPet: PetInstance = {
    type: petDef.name,
    attack: petDef.baseAttack,
    health: petDef.baseHealth,
    perk: null,
    xp: 1,
    level: 1,
  };

  const occupant = state.board[boardPosition];
  let newBoard: Board = [...state.board];

  if (occupant === null) {
    newBoard[boardPosition] = freshPet;
  } else if (occupant.type === shopPet.type) {
    newBoard[boardPosition] = mergePets(occupant, freshPet);
  } else {
    const shifted = openSlot(state.board, boardPosition);
    if (!shifted) {
      return Response.json({ error: "Board is full" }, { status: 400 });
    }
    newBoard = shifted;
    newBoard[boardPosition] = freshPet;
  }

  const newShopPets = [...state.shop.shopPets];
  newShopPets.splice(shopPosition, 1);

  const newShop: ShopState = { shopPets: newShopPets, shopFoods: state.shop.shopFoods };

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
