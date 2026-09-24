import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getLastBoardState } from "@/lib/game/board";
import { simulateBattle } from "@/lib/game/battle";
import { generateShop, getUnlockedTiers, pickFrozenItems, clearDiscount } from "@/lib/game/shop";
import { FrozenPositionsShape } from "@/lib/game/frozen-shape";
import { fireBoardShopAbility } from "@/lib/game/shop-ability";
import { PET_REGISTRY, SHOP_PET_POOL } from "@/lib/pets";
import { SHOP_FOOD_POOL } from "@/lib/foods";
import { pickRandom } from "@/lib/utils/random";
import { createPet } from "@/lib/game/pet";
import { TURN_GOLD, TROPHIES_TO_WIN } from "@/lib/game/rules";
import { z } from "zod";
import { PetInstance, Trigger } from "@/lib/types";

const EndTurnSchema = z.object(FrozenPositionsShape);

function buildGhostTeam(turn: number): PetInstance[] {
  const count = turn >= 2 ? 5 : 3;
  const unlockedTiers = getUnlockedTiers(turn);
  const pool = SHOP_PET_POOL.filter((p) => unlockedTiers.includes(p.tier));

  if (pool.length === 0) return [];

  return Array.from({ length: count }, () => {
    const petDef = pickRandom(pool);
    return createPet(petDef);
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
    Trigger.end_turn,
    state.board,
    emptyShop,
    PET_REGISTRY,
    previousBattle?.result
  );
  const preBattleBoard = endTurnResult.board;

  await prisma.submittedTeam.create({
    data: {
      gameId,
      playerId: session.user.id,
      playerName: session.user.name ?? session.user.email ?? "Unknown",
      turnNumber,
      lives,
      trophies,
      team: preBattleBoard,
    },
  });

  const [matchedSubmission = null] = await prisma.$queryRaw<
    { playerName: string; team: PetInstance[] }[]
  >`
    SELECT "playerName", "team" FROM "SubmittedTeam"
    WHERE "playerId" != ${session.user.id} AND "turnNumber" = ${turnNumber}
    ORDER BY
      CASE WHEN "lives" = ${lives} AND "trophies" = ${trophies} THEN 0 ELSE 1 END,
      "createdAt" ASC
    LIMIT 1
  `;

  const opponentTeam = matchedSubmission
    ? (matchedSubmission.team as PetInstance[])
    : buildGhostTeam(turnNumber);
  const opponentName = matchedSubmission?.playerName ?? null;

  const { result, steps } = simulateBattle(preBattleBoard, opponentTeam, PET_REGISTRY);
  const newLives = result === "LOSS" ? lives - 1 : lives;
  const newTrophies = result === "WIN" ? trophies + 1 : trophies;

  const { frozenPets, frozenFoods } = pickFrozenItems(state.shop, frozenPetPositions, frozenFoodPositions);

  const generatedShop = generateShop({
    turn: turnNumber + 1,
    pack: SHOP_PET_POOL,
    foodTypes: SHOP_FOOD_POOL,
    frozenPets: frozenPets.map(clearDiscount),
    frozenFoods: frozenFoods.map(clearDiscount),
  });

  // Start-of-turn fires right after the battle, on the pre-battle board and
  // the new turn's shop (so it can e.g. discount or stock it) — battle itself
  // stays fully ephemeral and never mutates persisted state.
  const startOfTurnResult = fireBoardShopAbility(Trigger.start_of_turn, preBattleBoard, generatedShop, PET_REGISTRY);
  const nextBoard = startOfTurnResult.board;
  const nextShop = startOfTurnResult.shop;
  const turnGoldDelta = endTurnResult.goldDelta + startOfTurnResult.goldDelta;

  const gameStatus = newLives <= 0 ? "LOST" : newTrophies >= TROPHIES_TO_WIN ? "WON" : "ACTIVE";

  const { battle } = await prisma.$transaction(async (tx) => {
    const battle = await tx.battle.create({
      data: {
        gameId,
        opponentTeam,
        opponentName,
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
        goldRemaining: TURN_GOLD + turnGoldDelta,
      },
    });

    if (gameStatus !== "ACTIVE") {
      await tx.game.update({ where: { id: gameId }, data: { status: gameStatus } });
    }

    return { battle };
  });

  return Response.json({
    result,
    gameStatus,
    battleId: battle.id,
    nextState: {
      board: nextBoard,
      shop: nextShop,
      gold: TURN_GOLD + turnGoldDelta,
      lives: newLives,
      trophies: newTrophies,
      turn: turnNumber + 1,
    },
  });
}
