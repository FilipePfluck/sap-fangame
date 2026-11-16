import { prisma } from "@/lib/prisma";

// The user's game in progress, or null. A user has at most one (see startGame).
export async function findActiveGameId(userId: string): Promise<string | null> {
  const game = await prisma.game.findFirst({
    where: { playerId: userId, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  return game?.id ?? null;
}

// Board states point at turns, so they go first. Submitted teams stay: other
// players are matched against them. Does nothing unless it's the user's active game.
export async function deleteActiveGame(userId: string, gameId: string): Promise<void> {
  const game = await prisma.game.findFirst({ where: { id: gameId, playerId: userId, status: "ACTIVE" } });
  if (!game) return;
  await prisma.$transaction([
    prisma.boardState.deleteMany({ where: { gameId } }),
    prisma.battle.deleteMany({ where: { gameId } }),
    prisma.gameTurn.deleteMany({ where: { gameId } }),
    prisma.game.delete({ where: { id: gameId } }),
  ]);
}
