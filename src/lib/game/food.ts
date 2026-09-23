import type { Board, FoodType, PetInstance, PetType } from "@/lib/types";
import { pickN } from "@/lib/utils/random";

// Whether the player has to pick a pet to feed this food to.
export function needsTarget(food: FoodType): boolean {
  return !food.targeting;
}

// Why `food` can't be fed right now, or null if it can. Shared by the buy
// route and the client so the two can't disagree.
export function feedError(
  food: FoodType,
  board: Board,
  boardPosition: number | undefined
): string | null {
  if (needsTarget(food)) {
    return boardPosition !== undefined && board[boardPosition] ? null : "Select a pet to feed";
  }
  return board.some((pet) => pet) ? null : "No pets to feed";
}

function applyStandardEffect(food: FoodType, pet: PetInstance): PetInstance {
  return {
    ...pet,
    attack: pet.attack + (food.effect.attack ?? 0),
    health: pet.health + (food.effect.health ?? 0),
    perk: food.perk ? food.perk : pet.perk,
  };
}

// Board positions the food acts on: the chosen one, or a random selection of
// occupied positions (all of them if there are fewer than asked for).
function pickTargets(food: FoodType, board: Board, boardPosition: number | undefined): number[] {
  if (!food.targeting) return boardPosition === undefined ? [] : [boardPosition];
  const occupied = board.flatMap((pet, i) => (pet ? [i] : []));
  return pickN(occupied, food.targeting.random);
}

// Applies a bought food to the board. Foods with their own `applyEffect`
// (Pill, ...) handle themselves; everything else gives each targeted pet its
// attack/health bonus and, if it's a perk, the perk.
export function applyFoodEffect(
  food: FoodType,
  board: Board,
  boardPosition: number | undefined,
  petRegistry: Record<string, PetType>
): Board {
  if (food.applyEffect) {
    return boardPosition === undefined
      ? [...board]
      : food.applyEffect({ board, boardPosition, petRegistry });
  }

  const newBoard = [...board];
  for (const i of pickTargets(food, board, boardPosition)) {
    const pet = newBoard[i];
    if (pet) newBoard[i] = applyStandardEffect(food, pet);
  }
  return newBoard;
}
