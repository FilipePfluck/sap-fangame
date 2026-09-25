import {
  Trigger,
  type Board,
  type FoodType,
  type PetInstance,
  type PetType,
} from "@/lib/types";
import { orderByAttack, pickN } from "@/lib/utils/random";
import { grantExperience } from "@/lib/game/merge";

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
    const target = boardPosition === undefined ? null : board[boardPosition];
    if (!target) return "Select a pet to feed";
    if (food.maxTargetXp !== undefined && target.xp >= food.maxTargetXp) {
      return "Pet has reached max experience";
    }
    return null;
  }
  return board.some((pet) => pet) ? null : "No pets to feed";
}

function applyStandardEffect(food: FoodType, pet: PetInstance): PetInstance {
  const attackBonus = food.effect.attack ?? 0;
  const healthBonus = food.effect.health ?? 0;
  const updatedPet: PetInstance = {
    ...pet,
    attack: pet.attack + attackBonus,
    health: pet.health + healthBonus,
    perk: food.perk ? food.perk : pet.perk,
  };
  if (food.temporary) {
    if (attackBonus) updatedPet.tempAttack = (pet.tempAttack ?? 0) + attackBonus;
    if (healthBonus) updatedPet.tempHealth = (pet.tempHealth ?? 0) + healthBonus;
  }
  if (food.experience !== undefined) grantExperience(updatedPet, food.experience);
  return updatedPet;
}

function cloneBoard(board: Board): Board {
  return board.map((pet) => (pet ? { ...pet } : null));
}

// Board positions the food acts on: the chosen one, or a random selection of
// occupied positions (all of them if there are fewer than asked for).
function pickTargets(food: FoodType, board: Board, boardPosition: number | undefined): number[] {
  if (!food.targeting) return boardPosition === undefined ? [] : [boardPosition];
  const occupied = board.flatMap((pet, i) => (pet ? [i] : []));
  return pickN(occupied, food.targeting.random);
}

export function triggerFriendAteFood(
  board: Board,
  fedPet: PetInstance,
  petRegistry: Record<string, PetType>
): void {
  if (fedPet.health <= 0) return;
  const friends = board.filter(
    (pet): pet is PetInstance => pet !== null && pet.health > 0
  );
  const listeners = friends.flatMap((pet) => {
    const ability = petRegistry[pet.type]?.ability;
    return ability?.trigger === Trigger.friend_ate_food
      ? [{ pet, ability }]
      : [];
  });
  for (const { pet, ability } of orderByAttack(listeners, (job) => job.pet.attack)) {
    ability.fn({
      self: pet,
      fedPet,
      friends,
      level: pet.level,
    });
  }
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
    if (boardPosition === undefined) return [...board];
    const newBoard = cloneBoard(board);
    const fedPet = newBoard[boardPosition];
    if (fedPet && food.triggersFriendAteFood !== false) {
      triggerFriendAteFood(newBoard, fedPet, petRegistry);
    }
    return food.applyEffect({ board: newBoard, boardPosition, petRegistry });
  }

  const newBoard = cloneBoard(board);
  for (const i of pickTargets(food, board, boardPosition)) {
    const pet = newBoard[i];
    if (pet) {
      if (food.maxTargetXp !== undefined && pet.xp >= food.maxTargetXp) {
        continue;
      }
      const fedPet = applyStandardEffect(food, pet);
      newBoard[i] = fedPet;
      if (food.triggersFriendAteFood !== false) {
        triggerFriendAteFood(newBoard, fedPet, petRegistry);
      }
    }
  }
  return newBoard;
}
