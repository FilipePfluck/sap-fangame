export const BUTTON_CLASS =
  "rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors";

// BUTTON_CLASS, highlighted while the toggle is on.
export function toggleButtonClass(selected: boolean): string {
  return `${BUTTON_CLASS} ${
    selected ? "bg-zinc-200 dark:bg-zinc-600 ring-2 ring-zinc-900 dark:ring-white" : ""
  }`;
}
