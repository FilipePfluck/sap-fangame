import { MAX_PET_EXPERIENCE, MAX_TEAM_SIZE } from "@/lib/game/rules";
import {
  ApiBoard,
  BuyResponse,
  PetData,
  ShopState,
  Trigger,
} from "@/lib/types";
import { prisma } from "@/lib/prisma";
import { PetInstance } from "@/lib/game/pet";

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

export type UpdatedBoard = {
  player: Board;
  opponent: Board;
};

export type FaintQueue = {
  formerIndex: number;
  pet: PetInstance;
}

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
  private pets: (PetInstance | null)[];
  private faintQueue: FaintQueue[] = [];

  static fromPetInstance(data: (PetInstance | null)[]): Board {
    return new Board(data.map((pet) => (pet ? pet.getData() : null)));
  }

  constructor(pets: (PetData | null)[]) {
    this.pets = pets.map((pet) => (pet ? new PetInstance(pet) : null));
  }

  // TODO - Obliterate this function and just let Board mutate.  Trying to maintain is causing nightmares with constantly
  // recreating massive amounts of sub-objects and making state harder to maintain, not easier
  clone(): Board {
    return new Board(this.pets.map((p) => (p ? { ...p.getData() } : null)));
  }

  // Moves all pets as far forward as possible
  moveForward(): Board {
    const existing: (PetInstance | null)[] = this.pets.filter(
      (p) => p !== null
    );
    existing.fill(null, existing.length, MAX_TEAM_SIZE);
    return Board.fromPetInstance(existing);
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

  get = (index: number) => this.pets[index] ?? null;
  getById = (id: number) => this.pets.filter(pet => pet?.getId() === id)[0];
  living = () => this.alive(this.pets);
  getFriends = (index: number) => this.alive(this.pets.splice(index, 1));
  getFriendly = () => this.living; // Alias for living
  getApiBoard = (): ApiBoard => this.pets.map((p) => p?.getData() ?? null);

  set(index: number, value: PetInstance | null): void {
    this.pets[index] = value ?? null;
  }

  private alive(): PetInstance[] {
    return this.pets
        .filter((pet) => pet !== null)
        // TypeScript doesn't consider this "non-null" if this check is included with the above filter
        .filter((pet) => pet.getHealth() > 0);
  }

  friend(index: number) {
    return this.pets
      .filter((_, i) => i !== index)
      .filter((pet) => pet !== null)
      .filter((pet) => pet.getHealth() > 0);
  }

  attack(
    opposingBoard: Board,
    from = 0,
    to = 0
  ): { dmgToPlayer: number; dmgToOpponent: number } {
    const outcome = {
      dmgToPlayer: 0, dmgToOpponent: 0
    };

    const playerPet = this.get(from);
    const opponentPet = opposingBoard.get(to);

    if (playerPet === null || opponentPet === null) return outcome;

    const [dmgToPlayer, dmgToOpponent] = playerPet.attack(opponentPet);
    this.set(0, playerPet);
    opposingBoard.set(0, opponentPet);

    outcome.dmgToPlayer = dmgToPlayer;
    outcome.dmgToOpponent = dmgToOpponent;

    this.updateFaintQueue();
    opposingBoard.updateFaintQueue();

    return outcome;
  }

  buy(newPet: PetData, i: number): BuyResponse {
    const occupant = this.pets[i];
    const newPetInstance = new PetInstance(newPet);
    const response: BuyResponse = {
      success: false,
      wasSummoned: false,
      levelUpReward: false,
    };

    if (occupant === null) {
      this.pets[i] = newPetInstance;
      response.success = true;
      response.wasSummoned = true;
      return response;
    }

    // Attempt to stack the pet
    if (occupant.getType() === newPet.type)
      return this.stack(i, newPet, response);

    // Attempt to summon the pet, either directly or by freeing space
    if (this.openSlot(i)) {
      this.pets[i] = newPetInstance;
      response.success = true;
      response.wasSummoned = true;
    } else {
      response.error = new Error("Board is full");
    }

    return response;
  }

  updateFaintQueue() {
    let index = 0
    for (const pet of this.pets) {
      if (pet?.resolveTrigger(Trigger.faint)) {
        this.faintQueue.push({ pet, formerIndex: index });
      }
      index += 1;
    }
  }

  resolveFaintQueue() {
    for (const entry of this.faintQueue) this.pets[entry.formerIndex] = null;
    this.pets = this.pets.filter((pet) => pet !== null);
    this.faintQueue = [];
  }

  toString(): string {
    const output = [];
    for (const pet of this.pets) output.push(pet?.toString() ?? "[EMPTY]");
    return output.join(" - ");
  }

  private stack(
    i: number,
    newPetData: PetData,
    response: BuyResponse
  ): BuyResponse {
    if (this.pets[i] === null) {
      response.error = new Error(
        "Stack should only be called for indices with a pet"
      );
      return response;
    }
    const newPetInstance = new PetInstance(newPetData);

    const error = this.mergeError(this.pets[i], newPetInstance);
    if (error) {
      response.error = new Error(error);
      return response;
    }
    response.success = true;

    const initialLevel = this.pets[i].getLevel();
    const merged = PetInstance.fromMerge(this.pets[i], newPetInstance);
    this.pets[i] = newPetInstance;

    if (merged.getLevel() > initialLevel) response.levelUpReward = true;
    return response;
  }

  private leftShift(from: number, to: number) {
    for (let i = to; i < from; i++) this.swap(i, i + 1);
  }

  private rightShift(from: number, to: number) {
    for (let i = to; i > from; i--) this.swap(i, i - 1);
  }

  // Mutates the board and returns if the operation succeeded
  private openSlot(target: number): boolean {
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
    const sellValue = pet.getSellValue();
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
    this.pets[j] = PetInstance.fromMerge(a, b);

    return true;
  }

  mergeError(a: PetInstance, b: PetInstance): string | null {
    if (a === null || b === null) return "Pets must exist";
    const aData = a.getData();
    const bData = b.getData();

    if (aData.type !== bData.type) return "Pets must be the same type to merge";
    if (aData.xp >= MAX_PET_EXPERIENCE || bData.xp >= MAX_PET_EXPERIENCE) {
      return "Pet has reached max experience";
    }
    return null;
  }
}

// TODO - Move into Pet.ts and remove Level as a property (instead derive using PetInstance)
export function computeLevel(xp: number): 1 | 2 | 3 {
  if (xp >= MAX_PET_EXPERIENCE) return 3;
  if (xp >= 2) return 2;
  return 1;
}

export function compactApiBoard(board: ApiBoard): PetData[] {
  return board.filter((p) => p !== null);
}