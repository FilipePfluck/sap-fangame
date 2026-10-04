import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getLastBoardState } from "@/lib/game/board";
import { PET_REGISTRY, SHOP_PET_POOL } from "@/lib/pets";
import { addLevelUpReward, applyFrozenFlags } from "@/lib/game/shop";
import { FrozenPositionsShape } from "@/lib/game/frozen-shape";
import {
  fireShopAbility,
  fireShopFriendBought,
  fireShopFriendSummoned,
} from "@/lib/game/shop-ability";
import { getPetCost } from "@/lib/game/costs";
import { createPet } from "@/lib/game/pet";
import { z } from "zod";
import { ApiBoard, ShopState, Trigger } from "@/lib/types";
import { Board } from "@/lib/game/board";

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
    return Response.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const {
    shopPosition,
    boardPosition,
    frozenPetPositions,
    frozenFoodPositions,
  } = parsed.data;
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
  const shopNow = applyFrozenFlags(
    state.shop,
    frozenPetPositions,
    frozenFoodPositions
  );

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

  const board = new Board(state.board);
  const response = board.buy(freshPet, boardPosition);

  if (response.error)
    return Response.json({ error: response.error }, { status: 400 });

  // Buying one half of a chained level-up reward removes the other half.
  const newShopPets = shopNow.shopPets.filter(
    (p, i) =>
      i !== shopPosition && !(shopPet.chainId && p.chainId === shopPet.chainId)
  );
  let currentShop: ShopState = {
    shopPets: newShopPets,
    shopFoods: shopNow.shopFoods,
  };

  let extraGold = 0;

  // Buying pets directly onto the board also counts as summoning
  let newBoardData: ApiBoard = board.pets;
  // TODO - Move abilities to  fire with more generic context to allow creating a queue of triggers to loop through and fire as needed
  if (response.wasSummoned)
    newBoardData = fireShopFriendSummoned(
      newBoardData,
      boardPosition,
      PET_REGISTRY
    );

  // Fires Buy trigger on new pet
  const buyResult = fireShopAbility(
    Trigger.buy,
    newBoardData[boardPosition]!,
    boardPosition,
    newBoardData,
    currentShop,
    PET_REGISTRY
  );
  newBoardData = buyResult.board;
  currentShop = buyResult.shop;
  extraGold += buyResult.goldDelta;

  // Fires Friend Bought trigger
  const friendBoughtResult = fireShopFriendBought(
    petDef,
    newBoardData,
    currentShop,
    PET_REGISTRY
  );
  newBoardData = friendBoughtResult.board;
  currentShop = friendBoughtResult.shop;
  extraGold += friendBoughtResult.goldDelta;

  if (response.levelUpReward) {
    // TODO: Update pet abilities to fire based on previous level
    const levelUpResult = fireShopAbility(
      Trigger.level_up,
      newBoardData[boardPosition]!,
      boardPosition,
      newBoardData,
      currentShop,
      PET_REGISTRY
    )
    newBoardData = levelUpResult.board;
    currentShop = levelUpResult.shop;
    extraGold += levelUpResult.goldDelta;

    currentShop = addLevelUpReward(
      currentShop,
      state.turn.turnNumber,
      SHOP_PET_POOL
    );
  }

  const boardState = await prisma.boardState.create({
    data: {
      gameId,
      turnId: state.turnId,
      boardState: newBoardData,
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
