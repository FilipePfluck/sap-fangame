import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getLastBoardState } from "@/lib/game/board";
import { simulateBattle } from "@/lib/game/battle";
import { generateShop } from "@/lib/game/shop";
import { TURTLE_PACK_PETS } from "@/lib/pets";
import { TURTLE_PACK_FOODS } from "@/lib/foods";
import type { PetInstance } from "@/lib/types";

function buildGhostTeam(turn: number): PetInstance[] {
  const count = turn >= 2 ? 5 : 3;
  const sloths: PetInstance[] = Array.from({ length: count }, () => ({
    type: "Sloth", attack: 1, health: 1, perk: null, xp: 0, level: 1,
  }));

  const bonusRounds = turn - 2;
  for (let r = 0; r < bonusRounds; r++) {
    // Pick 2 distinct random indices
    const a = Math.floor(Math.random() * count);
    let b = Math.floor(Math.random() * (count - 1));
    if (b >= a) b++;
    sloths[a].attack += 1;
    sloths[a].health += 1;
    sloths[b].attack += 1;
    sloths[b].health += 1;
  }

  return sloths;
}

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

  const { lives, trophies, turnNumber } = state.turn;
  const ghostTeam = buildGhostTeam(turnNumber);
  const { result, steps } = simulateBattle(state.board, ghostTeam);
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
