import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getLastBoardState } from "@/lib/game/board";
import { PET_REGISTRY, SHOP_PET_POOL } from "@/lib/pets";
import { mergePets, openSlot, levelUpRewardEarned } from "@/lib/game/merge";
import { addLevelUpReward, applyFrozenFlags } from "@/lib/game/shop";
import { FrozenPositionsShape } from "@/lib/game/frozen-shape";
import { fireShopAbility, fireShopFriendSummoned } from "@/lib/game/shop-ability";
import { getPetCost } from "@/lib/game/costs";
import { createPet } from "@/lib/game/pet";
import { z } from "zod";
import type { Board, PetInstance, ShopState } from "@/lib/types";

const BuyPetSchema = z.object({
  shopPosition: z.number().int().min(0).max(9),
  boardPosition: z.number().int().min(0).max(4),
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
  const parsed = BuyPetSchema.safeParse(body);
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

  const shopPet = shopNow.shopPets[shopPosition];
  if (!shopPet) {
    return Response.json({ error: "Invalid shop position" }, { status: 400 });
  }

  const cost = getPetCost(shopPet);
  if (state.goldRemaining < cost) {
    return Response.json({ error: "Not enough gold" }, { status: 400 });
  }

  const petDef = PET_REGISTRY[shopPet.type];
  if (!petDef) {
    return Response.json({ error: "Unknown pet type" }, { status: 400 });
  }

  const freshPet = createPet(petDef, shopPet.tempHealthBonus);

  const occupant = state.board[boardPosition];
  let currentBoard: Board = [...state.board];
  let placedPet: PetInstance = freshPet;
  let preMergeLevel = 0;
  let didLevelUp = false;
  let wasSummoned = false;
  let earnsLevelUpReward = false;

  if (occupant === null) {
    currentBoard[boardPosition] = freshPet;
    wasSummoned = true;
  } else if (occupant.type === shopPet.type) {
    preMergeLevel = occupant.level;
    const merged = mergePets(occupant, freshPet);
    didLevelUp = merged.level > preMergeLevel;
    earnsLevelUpReward = levelUpRewardEarned(occupant, freshPet);
    currentBoard[boardPosition] = merged;
    placedPet = merged;
  } else {
    const shifted = openSlot(state.board, boardPosition);
    if (!shifted) {
      return Response.json({ error: "Board is full" }, { status: 400 });
    }
    currentBoard = shifted;
    currentBoard[boardPosition] = freshPet;
    wasSummoned = true;
  }

  // Buying one half of a chained level-up reward removes the other half.
  const newShopPets = shopNow.shopPets.filter(
    (p, i) => i !== shopPosition && !(shopPet.chainId && p.chainId === shopPet.chainId)
  );
  let currentShop: ShopState = { shopPets: newShopPets, shopFoods: shopNow.shopFoods };

  let extraGold = 0;

  // Buying places the pet on the board immediately, so friends'
  // "friend-summoned" abilities (e.g. Horse) fire first — but only when a
  // new pet actually entered the board, not when it merged into one already
  // there.
  if (wasSummoned) {
    currentBoard = fireShopFriendSummoned(currentBoard, boardPosition, PET_REGISTRY);
  }

  // Fire buy ability (fires even when the purchase merged into an existing
  // pet — the buy still happened).
  const buyResult = fireShopAbility("buy", placedPet, boardPosition, currentBoard, currentShop, PET_REGISTRY);
  currentBoard = buyResult.board;
  currentShop = buyResult.shop;
  extraGold += buyResult.goldDelta;

  // Fire level-up ability if a merge caused a level-up.
  // Pass old level via a patched pet so ctx.level = old level in the ability fn.
  if (didLevelUp) {
    const petAtOldLevel = { ...placedPet, level: preMergeLevel };
    const levelUpResult = fireShopAbility("level-up", petAtOldLevel, boardPosition, currentBoard, currentShop, PET_REGISTRY);
    currentBoard = levelUpResult.board;
    currentShop = levelUpResult.shop;
    extraGold += levelUpResult.goldDelta;
  }

  if (earnsLevelUpReward) {
    currentShop = addLevelUpReward(currentShop, state.turn.turnNumber, SHOP_PET_POOL);
  }

  const boardState = await prisma.boardState.create({
    data: {
      gameId,
      turnId: state.turnId,
      boardState: currentBoard,
      shopState: currentShop,
      goldRemaining: state.goldRemaining - cost + extraGold,
    },
  });

  return Response.json({
    board: boardState.boardState,
    shop: boardState.shopState,
    gold: boardState.goldRemaining,
  });
}
