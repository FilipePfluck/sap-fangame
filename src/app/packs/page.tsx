import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { abandonGame, startGame } from "@/app/actions/game";
import { findActiveGameId } from "@/lib/game/active-game";
import { loadUserPacks } from "@/lib/game/pack-store";
import { toSavedPackJson } from "@/lib/game/pack-request";
import BackLink from "./BackLink";
import PackMenu from "./PackMenu";

export default async function PacksPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [savedPacks, activeGameId] = await Promise.all([
    loadUserPacks(session.user.id),
    findActiveGameId(session.user.id),
  ]);

  return (
    <>
      <BackLink href="/" />
      <PackMenu
        startGame={startGame}
        abandonGame={abandonGame}
        activeGameId={activeGameId}
        savedPacks={savedPacks.map(toSavedPackJson)}
      />
    </>
  );
}
