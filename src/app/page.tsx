import Link from "next/link";
import { auth, signOut } from "@/auth";

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
