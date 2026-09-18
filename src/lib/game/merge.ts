import type { Board, PetInstance } from "@/lib/types";

export function compactBoard(board: Board): PetInstance[] {
  return board.filter((p): p is PetInstance => p !== null);
}

export function computeLevel(xp: number): 1 | 2 | 3 {
  if (xp >= 6) return 3;
  if (xp >= 3) return 2;
  return 1;
}

// A level-up reward is earned whenever merging raises the pet above both
// parents' levels — except merging two level-2 pets (reaching level 3).
export function levelUpRewardEarned(a: PetInstance, b: PetInstance): boolean {
  const mergedLevel = computeLevel(a.xp + b.xp);
  if (mergedLevel <= Math.max(a.level, b.level)) return false;
  return !(a.level === 2 && b.level === 2);
}

export function mergePets(a: PetInstance, b: PetInstance): PetInstance {
  if (a.type !== b.type) {
    throw new Error("Cannot merge pets of different types");
  }
  const newXp = a.xp + b.xp;
  // Temp stats ride along with whichever pet supplied the higher stat.
  const attackSource = a.attack >= b.attack ? a : b;
  const healthSource = a.health >= b.health ? a : b;
  const merged: PetInstance = {
    type: a.type,
    attack: Math.max(a.attack, b.attack) + 1,
    health: Math.max(a.health, b.health) + 1,
    perk: a.perk ?? b.perk,
    xp: newXp,
    level: computeLevel(newXp),
  };
  if (attackSource.tempAttack) merged.tempAttack = attackSource.tempAttack;
  if (healthSource.tempHealth) merged.tempHealth = healthSource.tempHealth;
  return merged;
}

export function applyReorder(board: Board, from: number, to: number): Board {
  const newBoard = [...board];
  if (newBoard[to] === null) {
    newBoard[to] = newBoard[from];
    newBoard[from] = null;
  } else if (from > to) {
    // Moving left: shift pets in [to, from-1] one step right
    for (let i = from; i > to; i--) {
      newBoard[i] = newBoard[i - 1];
    }
    newBoard[to] = board[from];
  } else {
    // Moving right: shift pets in [from+1, to] one step left
    for (let i = from; i < to; i++) {
      newBoard[i] = newBoard[i + 1];
    }
    newBoard[to] = board[from];
  }
  return newBoard;
}

// Opens up targetPos by cascading toward the nearest free slot.
// Returns null if the board is full (no free slot exists).
export function openSlot(board: Board, targetPos: number): Board | null {
  // Find nearest free slot by scanning outward from targetPos
  let freePos: number | null = null;
  for (let dist = 1; dist < 5; dist++) {
    const left = targetPos - dist;
    const right = targetPos + dist;
    if (left >= 0 && board[left] === null) { freePos = left; break; }
    if (right <= 4 && board[right] === null) { freePos = right; break; }
  }
  if (freePos === null) return null;

  const newBoard = [...board];
  if (freePos < targetPos) {
    // Shift [freePos+1 .. targetPos] one step left
    for (let i = freePos; i < targetPos; i++) {
      newBoard[i] = newBoard[i + 1];
    }
  } else {
    // Shift [targetPos .. freePos-1] one step right
    for (let i = freePos; i > targetPos; i--) {
      newBoard[i] = newBoard[i - 1];
    }
  }
  newBoard[targetPos] = null;
  return newBoard;
}
