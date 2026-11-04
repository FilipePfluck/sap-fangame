import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { startGame } from "@/app/actions/game";
import PackMenu from "./PackMenu";

export default async function PacksPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col gap-4 py-16 px-16 bg-white dark:bg-black">
        <Link
          href="/"
          className="self-start px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
        >
          ← Back
        </Link>
        <PackMenu startGame={startGame} />
      </main>
    </div>
  );
}
