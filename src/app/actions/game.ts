"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { generateShop } from "@/lib/game/shop";
import { TURTLE_PACK_PETS } from "@/lib/pets";
import { TURTLE_PACK_FOODS } from "@/lib/foods";

export async function startGame() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const existing = await prisma.game.findFirst({
    where: { playerId: session.user.id, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  });
  if (existing) redirect(`/arena/${existing.id}`);

  const shop = generateShop({ turn: 1, pack: TURTLE_PACK_PETS, foodTypes: TURTLE_PACK_FOODS });
  const game = await prisma.game.create({
    data: {
      playerId: session.user.id,
      turns: { create: { turnNumber: 1, lives: 5, trophies: 0 } },
    },
    include: { turns: true },
  });
  await prisma.boardState.create({
    data: {
      gameId: game.id,
      turnId: game.turns[0].id,
      boardState: [null, null, null, null, null],
      shopState: shop,
      goldRemaining: 10,
    },
  });
  redirect(`/arena/${game.id}`);
}
