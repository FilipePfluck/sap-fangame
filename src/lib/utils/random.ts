export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function pickN<T>(arr: T[], n: number): T[] {
  if (n >= arr.length) return [...arr];
  const result: T[] = [];
  const remaining = [...arr];
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(Math.random() * remaining.length);
    result.push(remaining[idx]);
    remaining.splice(idx, 1);
  }
  return result;
}
