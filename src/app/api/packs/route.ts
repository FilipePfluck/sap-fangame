import { auth } from "@/auth";
import { createUserPack, loadUserPacks } from "@/lib/game/pack-store";
import { parsePackRequest, toSavedPackJson } from "@/lib/game/pack-request";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const savedPacks = await loadUserPacks(session.user.id);
  return Response.json(savedPacks.map(toSavedPackJson));
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const packRequest = parsePackRequest(body);
  if ("error" in packRequest) {
    return Response.json({ error: packRequest.error }, { status: 400 });
  }

  const savedPack = await createUserPack(session.user.id, packRequest.pack);
  if (!savedPack) {
    return Response.json({ error: "You've saved the most packs you can" }, { status: 409 });
  }

  return Response.json(toSavedPackJson(savedPack), { status: 201 });
}
