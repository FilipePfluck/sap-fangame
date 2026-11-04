import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { startGame } from "@/app/actions/game";
import BackLink from "./BackLink";
import PackMenu from "./PackMenu";

export default async function PacksPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <>
      <BackLink href="/" />
      <PackMenu startGame={startGame} />
    </>
  );
}
