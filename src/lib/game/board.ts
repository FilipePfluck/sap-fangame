import { getSellValue } from "@/lib/game/costs";
import { MAX_PET_EXPERIENCE } from "@/lib/game/rules";
import { ApiBoard, BuyResponse, PetInstance, ShopState } from "@/lib/types";
import { prisma } from "@/lib/prisma";

export type ResolvedBoardState = {
  id: string;
  gameId: string;
  turnId: string;
  board: ApiBoard;
  shop: ShopState;
  goldRemaining: number;
  turn: {
    id: string;
    turnNumber: number;
    lives: number;
    trophies: number;
  };
};

export async function getLastBoardState(
  gameId: string
): Promise<ResolvedBoardState | null> {
  const boardState = await prisma.boardState.findFirst({
    where: { gameId },
    orderBy: { createdAt: "desc" },
    include: { turn: true },
  });

  if (!boardState) return null;

  return {
    id: boardState.id,
    gameId: boardState.gameId,
    turnId: boardState.turnId,
    board: boardState.boardState,
    shop: boardState.shopState as ShopState,
    goldRemaining: boardState.goldRemaining,
    turn: {
      id: boardState.turn.id,
      turnNumber: boardState.turn.turnNumber,
      lives: boardState.turn.lives,
      trophies: boardState.turn.trophies,
    },
  };
}

export class Board {
  pets: ApiBoard;

  constructor(pets: (PetInstance | null)[]) {
    this.pets = pets;
  }

  clone(): Board {
    return new Board(this.pets.map((p) => (p ? { ...p } : null)));
  }

  swap(from: number, to: number) {
    if (this.pets[to] === null) {
      this.pets[to] = this.pets[from];
      this.pets[from] = null;
      return;
    }

    const tempPet = this.pets[from];
    this.pets[from] = this.pets[to];
    this.pets[to] = tempPet;
  }

  buy(newPet: PetInstance, i: number): BuyResponse {
    const occupant = this.pets[i];
    const response: BuyResponse = {
      success: false,
      wasSummoned: false,
      levelUpReward: false,
    };

    // Attempt to stack the pet
    if (occupant?.type === newPet.type) {
      const error = this.mergeError(occupant, newPet);
      if (error) {
        response.error = new Error(error);
        return response;
      }
      response.success = true;

      const initialLevel = occupant.level;
      const merged = this.mergePets(occupant, newPet);
      this.pets[i] = merged;

      if (merged.level > initialLevel) response.levelUpReward = true;
      return response;
    }

    // Attempt to summon the pet, either directly or by freeing space
    if (this.openSlot(i)) {
      this.pets[i] = newPet;
      response.success = true;
      response.wasSummoned = true;
    } else {
      response.error = new Error("Board is full");
    }

    return response;
  }

  leftShift(from: number, to: number) {
    for (let i = to; i < from; i++) this.swap(i, i + 1);
  }

  rightShift(from: number, to: number) {
    for (let i = to; i > from; i--) this.swap(i, i - 1);
  }

  // Mutates the board and returns if the operation succeeded
  openSlot(target: number): boolean {
    // No-op if slot is open
    if (this.pets[target] === null) return true;

    // Find nearest open slot
    let freePos: number | null = null;
    for (let dist = 1; dist < 5; dist++) {
      const left = target - dist;
      const right = target + dist;
      if (left >= 0 && this.pets[left] === null) {
        freePos = left;
        break;
      }
      if (right <= 4 && this.pets[right] === null) {
        freePos = right;
        break;
      }
    }

    if (freePos === null) return false;

    if (freePos < target) this.leftShift(target, freePos);
    if (freePos > target) this.rightShift(target, freePos);
    return true;
  }

  sell(i: number): number {
    const pet = this.pets[i];

    if (pet === null) return 0;
    const sellValue = getSellValue(pet);
    this.pets[i] = null;
    return sellValue;
  }

  // Mutates the board and returns if the operation succeeded
  merge(i: number, j: number) {
    const a = this.pets[i]!;
    const b = this.pets[j]!;

    if (a === null || b === null) return false;

    const error = this.mergeError(a, b);
    if (error) throw new Error(error);

    this.pets[i] = null;
    this.pets[j] = this.mergePets(a, b);

    return true;
  }

  mergePets(a: PetInstance, b: PetInstance): PetInstance {
    // TODO: Update pets to have a reasonable method of handling stat changes
    // The "true" stat value should not be hidden behind visible stat - temp stat
    const mergedAttack =
      Math.max(a.attack - (a.tempAttack ?? 0), b.attack - (b.tempAttack ?? 0)) +
      1;
    const mergedHealth =
      Math.max(a.health - (a.tempHealth ?? 0), b.health - (b.tempHealth ?? 0)) +
      1;

    const mergedTempAttack = Math.max(a.tempAttack ?? 0, b.tempAttack ?? 0);
    const mergedTempHealth = Math.max(a.tempHealth ?? 0, b.tempHealth ?? 0);

    const mergedXp = this.mergedXp(a, b);

    return {
      type: a.type,
      attack: mergedAttack,
      health: mergedHealth,
      perk: a.perk ?? b.perk,
      xp: mergedXp,
      level: computeLevel(mergedXp),
      tempAttack: mergedTempAttack,
      tempHealth: mergedTempHealth,
    };
  }

  mergedXp(a: PetInstance, b: PetInstance): number {
    return Math.min(MAX_PET_EXPERIENCE, a.xp + b.xp + 1);
  }

  mergeError(a: PetInstance, b: PetInstance): string | null {
    if (a === null || b === null) return "Pets must exist";
    if (a.type !== b.type) return "Pets must be the same type to merge";
    if (a.xp >= MAX_PET_EXPERIENCE || b.xp >= MAX_PET_EXPERIENCE) {
      return "Pet has reached max experience";
    }
    return null;
  }
}

export function computeLevel(xp: number): 1 | 2 | 3 {
  if (xp >= MAX_PET_EXPERIENCE) return 3;
  if (xp >= 2) return 2;
  return 1;
}