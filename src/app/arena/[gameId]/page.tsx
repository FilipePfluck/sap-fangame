import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getLastBoardState } from "@/lib/game/board";
import { redirect, notFound } from "next/navigation";
import GameClient from "./GameClient";

export default async function ArenaPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game || game.playerId !== session.user.id) notFound();

  if (game.status !== "ACTIVE") redirect("/");

  const state = await getLastBoardState(gameId);
  if (!state) notFound();

  return (
    <GameClient
      key={`${gameId}-${state.turn.turnNumber}`}
      gameId={gameId}
      initialBoard={state.board}
      initialShop={state.shop}
      initialGold={state.goldRemaining}
      initialLives={state.turn.lives}
      initialTrophies={state.turn.trophies}
      initialTurn={state.turn.turnNumber}
    />
  );
}
