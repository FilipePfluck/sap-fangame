"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { STARTING_LIVES, TURN_GOLD } from "@/lib/game/rules";
import { generateShop } from "@/lib/game/shop";
import { SHOP_PET_POOL } from "@/lib/pets";
import { SHOP_FOOD_POOL } from "@/lib/foods";
import { deleteActiveGame, findActiveGameId } from "@/lib/game/active-game";

export async function startGame() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const activeGameId = await findActiveGameId(session.user.id);
  if (activeGameId) redirect(`/arena/${activeGameId}`);

  const shop = generateShop({ turn: 1, pack: SHOP_PET_POOL, foodTypes: SHOP_FOOD_POOL });
  const game = await prisma.game.create({
    data: {
      playerId: session.user.id,
      turns: { create: { turnNumber: 1, lives: STARTING_LIVES, trophies: 0 } },
    },
    include: { turns: true },
  });
  await prisma.boardState.create({
    data: {
      gameId: game.id,
      turnId: game.turns[0].id,
      boardState: [null, null, null, null, null],
      shopState: shop,
      goldRemaining: TURN_GOLD,
    },
  });
  redirect(`/arena/${game.id}`);
}

export async function abandonGame(gameId: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await deleteActiveGame(session.user.id, gameId);
  revalidatePath("/packs");
}
