import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getLastBoardState } from "@/lib/game/board";
import { PET_REGISTRY } from "@/lib/pets";
import { FOOD_REGISTRY } from "@/lib/foods";
import { mergePets, computeLevel, openSlot } from "@/lib/game/merge";
import { fireShopAbility } from "@/lib/game/shop-ability";
import { z } from "zod";
import type { Board, PetInstance, ShopState } from "@/lib/types";

const BuyPetSchema = z.object({
  shopPosition: z.number().int().min(0).max(4),
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
  const parsed = BuyPetSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  const { shopPosition, boardPosition } = parsed.data;
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

  if (state.goldRemaining < 3) {
    return Response.json({ error: "Not enough gold" }, { status: 400 });
  }

  const shopPet = state.shop.shopPets[shopPosition];
  if (!shopPet) {
    return Response.json({ error: "Invalid shop position" }, { status: 400 });
  }

  const petDef = PET_REGISTRY[shopPet.type];
  if (!petDef) {
    return Response.json({ error: "Unknown pet type" }, { status: 400 });
  }

  const freshPet: PetInstance = {
    type: petDef.name,
    attack: petDef.baseAttack,
    health: petDef.baseHealth + (shopPet.tempHealthBonus ?? 0),
    perk: null,
    xp: 1,
    level: 1,
  };

  const occupant = state.board[boardPosition];
  let currentBoard: Board = [...state.board];
  let placedPet: PetInstance = freshPet;
  let preMergeLevel = 0;
  let didLevelUp = false;

  if (occupant === null) {
    currentBoard[boardPosition] = freshPet;
  } else if (occupant.type === shopPet.type) {
    preMergeLevel = occupant.level;
    const merged = mergePets(occupant, freshPet);
    didLevelUp = merged.level > preMergeLevel;
    currentBoard[boardPosition] = merged;
    placedPet = merged;
  } else {
    const shifted = openSlot(state.board, boardPosition);
    if (!shifted) {
      return Response.json({ error: "Board is full" }, { status: 400 });
    }
    currentBoard = shifted;
    currentBoard[boardPosition] = freshPet;
  }

  const newShopPets = [...state.shop.shopPets];
  newShopPets.splice(shopPosition, 1);
  let currentShop: ShopState = { shopPets: newShopPets, shopFoods: state.shop.shopFoods };

  let extraGold = 0;

  // Fire buy ability
  const buyResult = fireShopAbility("buy", placedPet, boardPosition, currentBoard, currentShop, PET_REGISTRY, FOOD_REGISTRY);
  currentBoard = buyResult.board as Board;
  currentShop = buyResult.shop;
  extraGold += buyResult.goldDelta;

  // Fire level-up ability if a merge caused a level-up.
  // Pass old level via a patched pet so ctx.level = old level in the ability fn.
  if (didLevelUp) {
    const petAtOldLevel = { ...placedPet, level: preMergeLevel };
    const levelUpResult = fireShopAbility("level-up", petAtOldLevel, boardPosition, currentBoard, currentShop, PET_REGISTRY, FOOD_REGISTRY);
    currentBoard = levelUpResult.board as Board;
    currentShop = levelUpResult.shop;
    extraGold += levelUpResult.goldDelta;
  }

  const boardState = await prisma.boardState.create({
    data: {
      gameId,
      turnId: state.turnId,
      boardState: currentBoard,
      shopState: currentShop,
      goldRemaining: state.goldRemaining - 3 + extraGold,
    },
  });

  return Response.json({
    board: boardState.boardState,
    shop: boardState.shopState,
    gold: boardState.goldRemaining,
  });
}
