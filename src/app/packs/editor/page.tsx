import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { loadUserPack } from "@/lib/game/pack-store";
import { parsePackId, toSavedPackJson, type SavedPackJson } from "@/lib/game/pack-request";
import BackLink from "../BackLink";
import PackEditor from "./PackEditor";

// The saved pack named by `?packId=`, or undefined for a new pack.
async function loadEditedPack(userId: string, packIdParam: string | string[] | undefined): Promise<SavedPackJson | undefined> {
  if (packIdParam === undefined) return undefined;
  const packId = typeof packIdParam === "string" ? parsePackId(packIdParam) : null;
  const savedPack = packId === null ? null : await loadUserPack(userId, packId);
  if (!savedPack) notFound();
  return toSavedPackJson(savedPack);
}

export default async function PackEditorPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const savedPack = await loadEditedPack(session.user.id, (await searchParams).packId);

  return (
    <>
      <BackLink href="/packs" />
      <PackEditor savedPack={savedPack} />
    </>
  );
}
