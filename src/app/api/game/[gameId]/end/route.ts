import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getLastBoardState } from "@/lib/game/board";
import { simulateBattle } from "@/lib/game/battle";
import { generateShop } from "@/lib/game/shop";
import { TURTLE_PACK_PETS } from "@/lib/pets";
import { TURTLE_PACK_FOODS } from "@/lib/foods";
import type { PetInstance } from "@/lib/types";

const GHOST_OPPONENT: PetInstance[] = [
  { type: "Sloth", attack: 1, health: 1, perk: null, xp: 0, level: 1 },
  { type: "Sloth", attack: 1, health: 1, perk: null, xp: 0, level: 1 },
  { type: "Sloth", attack: 1, health: 1, perk: null, xp: 0, level: 1 },
];

export async function POST(
  _request: Request,
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

  const state = await getLastBoardState(gameId);
  if (!state) {
    return Response.json({ error: "Game state not found" }, { status: 404 });
  }

  const { result, steps } = simulateBattle(state.board, GHOST_OPPONENT);

  const { lives, trophies, turnNumber } = state.turn;
  const newLives = result === "LOSS" ? lives - 1 : lives;
  const newTrophies = result === "WIN" ? trophies + 1 : trophies;

  const nextShop = generateShop({
    turn: turnNumber + 1,
    pack: TURTLE_PACK_PETS,
    foodTypes: TURTLE_PACK_FOODS,
  });

  const { battle } = await prisma.$transaction(async (tx) => {
    const battle = await tx.battle.create({
      data: {
        gameId,
        opponentTeam: GHOST_OPPONENT,
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
        boardState: state.board,
        shopState: nextShop,
        goldRemaining: 10,
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

  return Response.json({ result, battleId: battle.id });
}
