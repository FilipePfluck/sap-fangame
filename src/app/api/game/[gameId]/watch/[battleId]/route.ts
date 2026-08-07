import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ gameId: string; battleId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { gameId, battleId } = await params;

  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game || game.playerId !== session.user.id) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const battle = await prisma.battle.findUnique({ where: { id: battleId } });
  if (!battle || battle.gameId !== gameId) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json({
    id: battle.id,
    gameId: battle.gameId,
    opponentTeam: battle.opponentTeam,
    result: battle.result,
    steps: battle.steps,
    createdAt: battle.createdAt,
  });
}
