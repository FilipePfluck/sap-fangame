// Auth is checked in each page, not here: layouts don't re-render on navigation.
export default function PacksLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col gap-4 py-16 px-16 bg-white dark:bg-black">
        {children}
      </main>
    </div>
  );
}
