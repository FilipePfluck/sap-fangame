import { auth } from "@/auth";
import { deleteUserPack, updateUserPack } from "@/lib/game/pack-store";
import { parsePackId, parsePackRequest, toSavedPackJson } from "@/lib/game/pack-request";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ packId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const packId = parsePackId((await params).packId);
  if (packId === null) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const packRequest = parsePackRequest(body);
  if ("error" in packRequest) {
    return Response.json({ error: packRequest.error }, { status: 400 });
  }

  if (!(await updateUserPack(session.user.id, packId, packRequest.pack))) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json(toSavedPackJson({ id: packId, pack: packRequest.pack }));
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ packId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const packId = parsePackId((await params).packId);
  if (packId === null || !(await deleteUserPack(session.user.id, packId))) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return new Response(null, { status: 204 });
}
