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

// Deletes the user's active game with everything that belongs to it. Board
// states point at turns, so they go first; the game goes last. Submitted teams
// stay, since other players are matched against them. False when the game
// isn't the user's active game.
export async function deleteActiveGame(userId: string, gameId: string): Promise<boolean> {
  const game = await prisma.game.findFirst({ where: { id: gameId, playerId: userId, status: "ACTIVE" } });
  if (!game) return false;
  await prisma.$transaction([
    prisma.boardState.deleteMany({ where: { gameId } }),
    prisma.battle.deleteMany({ where: { gameId } }),
    prisma.gameTurn.deleteMany({ where: { gameId } }),
    prisma.game.delete({ where: { id: gameId } }),
  ]);
  return true;
}
