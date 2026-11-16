"use server";

import { auth } from "@/auth";
import { prisma, toPrismaJson } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { STARTING_LIVES, TURN_GOLD } from "@/lib/game/rules";
import { generateShop } from "@/lib/game/shop";
import { loadStartingPack } from "@/lib/game/pack-store";
import { deleteActiveGame, findActiveGameId } from "@/lib/game/active-game";

// `packId` is the saved pack to play, or null for Turtle.
export async function startGame(packId: number | null) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const activeGameId = await findActiveGameId(session.user.id);
  if (activeGameId) redirect(`/arena/${activeGameId}`);

  const pack = await loadStartingPack(session.user.id, packId);
  if (!pack) redirect("/packs");

  const shop = generateShop({ turn: 1, pack: pack.shopPets(), foodTypes: pack.shopFoods() });
  const game = await prisma.game.create({
    data: {
      playerId: session.user.id,
      pack: toPrismaJson(pack.serialize()),
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
