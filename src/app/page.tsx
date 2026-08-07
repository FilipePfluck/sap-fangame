import Link from "next/link";
import { auth, signOut } from "@/auth";
import { startGame } from "@/app/actions/game";

export default async function Home() {
  const session = await auth();

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center gap-4 py-32 px-16 bg-white dark:bg-black sm:items-start">
        <p>
          This is a Super Auto Pets fangame. It has no relation to Team Wood
          Games.
        </p>
        {session ? (
          <div className="flex gap-3">
            <form action={startGame}>
              <button
                type="submit"
                className="px-4 py-2 rounded bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
              >
                Play
              </button>
            </form>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="px-4 py-2 rounded bg-white text-black hover:bg-zinc-100 transition-colors"
              >
                Sign Out
              </button>
            </form>
          </div>
        ) : (
          <Link
            href="/login"
            className="px-4 py-2 rounded bg-white text-black hover:bg-zinc-100 transition-colors"
          >
            Login
          </Link>
        )}
      </main>
    </div>
  );
}
