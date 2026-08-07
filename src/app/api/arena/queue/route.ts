import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateShop } from "@/lib/game/shop";
import { TURTLE_PACK_PETS } from "@/lib/pets";
import { TURTLE_PACK_FOODS } from "@/lib/foods";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const shop = generateShop({
    turn: 1,
    pack: TURTLE_PACK_PETS,
    foodTypes: TURTLE_PACK_FOODS,
  });

  const board = [null, null, null, null, null];

  const game = await prisma.game.create({
    data: {
      playerId: session.user.id,
      turns: {
        create: {
          turnNumber: 1,
          lives: 5,
          trophies: 0,
        },
      },
    },
    include: { turns: true },
  });

  const turn = game.turns[0];

  const boardState = await prisma.boardState.create({
    data: {
      gameId: game.id,
      turnId: turn.id,
      boardState: board,
      shopState: shop,
      goldRemaining: 10,
    },
  });

  return Response.json({
    gameId: game.id,
    board: boardState.boardState,
    shop: boardState.shopState,
    lives: turn.lives,
    trophies: turn.trophies,
    turn: turn.turnNumber,
    gold: boardState.goldRemaining,
  });
}
