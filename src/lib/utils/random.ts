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

export function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Orders entries by descending attack (highest fires first). Ties are broken
// randomly rather than by original array position — shuffle first, then a
// stable sort keeps that random order for equal-attack entries.
export function orderByAttack<T>(entries: T[], getAttack: (entry: T) => number): T[] {
  return shuffle(entries).sort((a, b) => getAttack(b) - getAttack(a));
}
