import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getLastBoardState } from "@/lib/game/board";
import { simulateBattle } from "@/lib/game/battle";
import { generateShop, getUnlockedTiers } from "@/lib/game/shop";
import { fireBoardShopAbility } from "@/lib/game/shop-ability";
import { PET_REGISTRY, SHOP_PET_POOL } from "@/lib/pets";
import { SHOP_FOOD_POOL } from "@/lib/foods";
import { pickRandom } from "@/lib/utils/random";
import { z } from "zod";
import type { Board, PetInstance } from "@/lib/types";

const EndTurnSchema = z.object({
  frozenPetPositions: z.array(z.number().int().min(0)).default([]),
  frozenFoodPositions: z.array(z.number().int().min(0)).default([]),
});

function buildGhostTeam(turn: number): PetInstance[] {
  const count = turn >= 2 ? 5 : 3;
  const unlockedTiers = getUnlockedTiers(turn);
  const pool = SHOP_PET_POOL.filter((p) => unlockedTiers.includes(p.tier));

  if (pool.length === 0) return [];

  return Array.from({ length: count }, () => {
    const petDef = pickRandom(pool);
    return {
      type: petDef.name,
      attack: petDef.baseAttack,
      health: petDef.baseHealth,
      perk: petDef.innatePerk ?? null,
      xp: 1,
      level: 1,
    };
  });
}

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
  const parsed = EndTurnSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return Response.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }
  const { frozenPetPositions, frozenFoodPositions } = parsed.data;

  const [game, state, previousBattle] = await Promise.all([
    prisma.game.findUnique({ where: { id: gameId } }),
    getLastBoardState(gameId),
    prisma.battle.findFirst({ where: { gameId }, orderBy: { createdAt: "desc" } }),
  ]);
  if (!game || game.playerId !== session.user.id) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  if (!state) {
    return Response.json({ error: "Game state not found" }, { status: 404 });
  }

  const { lives, trophies, turnNumber } = state.turn;
  const emptyShop = { shopPets: [], shopFoods: [] };

  // End-turn fires before this turn's battle (reacting to the *previous*
  // battle's result), so its buffs help the upcoming fight.
  const endTurnResult = fireBoardShopAbility(
    "end-turn",
    state.board,
    emptyShop,
    PET_REGISTRY,
    previousBattle?.result
  );
  const preBattleBoard = endTurnResult.board as Board;

  const ghostTeam = buildGhostTeam(turnNumber);
  const { result, steps } = simulateBattle(preBattleBoard, ghostTeam, PET_REGISTRY);
  const newLives = result === "LOSS" ? lives - 1 : lives;
  const newTrophies = result === "WIN" ? trophies + 1 : trophies;

  // Start-of-turn fires right after the battle, on the pre-battle board —
  // battle itself stays fully ephemeral and never mutates persisted state.
  const startOfTurnResult = fireBoardShopAbility("start-of-turn", preBattleBoard, emptyShop, PET_REGISTRY);
  const nextBoard = startOfTurnResult.board as Board;
  const turnGoldDelta = endTurnResult.goldDelta + startOfTurnResult.goldDelta;

  const frozenPets = frozenPetPositions
    .filter((i) => i < state.shop.shopPets.length)
    .map((i) => state.shop.shopPets[i]);

  const frozenFoods = frozenFoodPositions
    .filter((i) => i < state.shop.shopFoods.length)
    .map((i) => state.shop.shopFoods[i]);

  const nextShop = generateShop({
    turn: turnNumber + 1,
    pack: SHOP_PET_POOL,
    foodTypes: SHOP_FOOD_POOL,
    frozenPets,
    frozenFoods,
  });

  const { battle } = await prisma.$transaction(async (tx) => {
    const battle = await tx.battle.create({
      data: {
        gameId,
        opponentTeam: ghostTeam,
        result,
        steps,
      },
    });

    await tx.gameTurn.update({
      where: { id: state.turn.id },
      data: { lives: newLives, trophies: newTrophies },
    });

    const newTurn = await tx.gameTurn.create({
      data: {
        gameId,
        turnNumber: turnNumber + 1,
        lives: newLives,
        trophies: newTrophies,
      },
    });

    await tx.boardState.create({
      data: {
        gameId,
        turnId: newTurn.id,
        boardState: nextBoard,
        shopState: nextShop,
        goldRemaining: 10 + turnGoldDelta,
      },
    });

    if (newTrophies >= 10 || newLives <= 0) {
      await tx.game.update({
        where: { id: gameId },
        data: { status: newLives <= 0 ? "LOST" : "WON" },
      });
    }

    return { battle };
  });

  return Response.json({
    result,
    battleId: battle.id,
    nextState: {
      board: nextBoard,
      shop: nextShop,
      gold: 10 + turnGoldDelta,
      lives: newLives,
      trophies: newTrophies,
      turn: turnNumber + 1,
    },
  });
}
