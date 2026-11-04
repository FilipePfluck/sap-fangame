import { redirect } from "next/navigation";
import { auth } from "@/auth";
import BackLink from "../BackLink";
import PackEditor from "./PackEditor";

export default async function PackEditorPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <>
      <BackLink href="/packs" />
      <PackEditor />
    </>
  );
}
