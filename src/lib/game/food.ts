import {
  Trigger,
  type FoodType,
  type PetInstance,
  type StaticPet,
  ApiBoard,
} from "@/lib/types";
import { orderByAttack, pickN } from "@/lib/utils/random";
import { grantExperience } from "@/lib/game/merge";
import { MAX_PET_EXPERIENCE } from "@/lib/game/rules";
import { Board } from "@/lib/game/board";
import { getAbility, tryIncrementTriggerCount } from "@/lib/pets/ability";

// Whether the player has to pick a pet to feed this food to.
export function needsTarget(food: FoodType): boolean {
  return !food.targeting;
}

function isMaxedExperienceTarget(food: FoodType, pet: PetInstance): boolean {
  return "experience" in food.effect && pet.xp >= MAX_PET_EXPERIENCE;
}

// Why `food` can't be fed right now, or null if it can. Shared by the buy
// route and the client so the two can't disagree.
export function feedError(
  food: FoodType,
  board: ApiBoard,
  boardPosition: number | undefined
): string | null {
  if (needsTarget(food)) {
    const target = boardPosition === undefined ? null : board[boardPosition];
    if (!target) return "Select a pet to feed";
    if (isMaxedExperienceTarget(food, target)) {
      return "Pet has reached max experience";
    }
    return null;
  }
  return board.some((pet) => pet) ? null : "No pets to feed";
}

// TODO - Give food effects defaults (e.g. attack = 0) instead of handling undefined here
function applyStandardEffect(
  food: FoodType,
  pet: PetInstance,
  multiplier = 1
): PetInstance {
  const attackBonus = (food.effect.attack ?? 0) * multiplier;
  const healthBonus = (food.effect.health ?? 0) * multiplier;
  const updatedPet: PetInstance = {
    ...pet,
    attack: pet.attack + attackBonus,
    health: pet.health + healthBonus,
    perk: food.perk ? { ...food.perk } : pet.perk,
  };
  if (food.effect.temporary) {
    if (attackBonus)
      updatedPet.tempAttack = (pet.tempAttack ?? 0) + attackBonus;
    if (healthBonus)
      updatedPet.tempHealth = (pet.tempHealth ?? 0) + healthBonus;
  }
  if ("experience" in food.effect)
    grantExperience(updatedPet, food.effect.experience ?? 0);
  return updatedPet;
}

// How many times over this food's attack/health applies: 1 plus the level of
// each Cat with uses left this turn, each of which spends one. Foods without
// attack/health (Chocolate, perks) neither multiply nor spend a use.
function consumeFoodMultiplier(
  food: FoodType,
  board: ApiBoard,
  petRegistry: Record<string, StaticPet>
): number {
  if (!food.effect.attack && !food.effect.health) return 1;
  let multiplier = 1;
  for (const pet of board) {
    const boost = pet && petRegistry[pet.type]?.foodStatMultiplier;
    if (
      boost &&
      pet.health > 0 &&
      tryIncrementTriggerCount(pet, Trigger.food_bought, boost.usesPerTurn)
    ) {
      multiplier += pet.level;
    }
  }
  return multiplier;
}

// Board positions the food acts on: the chosen one, or a random selection of
// occupied positions (all of them if there are fewer than asked for).
function pickTargets(
  food: FoodType,
  board: Board,
  boardPosition: number | undefined
): number[] {
  if (!food.targeting)
    return boardPosition === undefined ? [] : [boardPosition];
  const occupied = board.pets.flatMap((pet, i) => (pet ? [i] : []));
  return pickN(occupied, food.targeting.random);
}

export function triggerFriendAteFood(
  board: ApiBoard,
  fedPet: PetInstance,
  petRegistry: Record<string, StaticPet>,
  foodGroup?: FoodType["foodGroup"]
): void {
  if (fedPet.health <= 0) return;
  // TODO - Wrap board in a class with board.friends() / board.friendly() helpers
  const friends = board.filter(
    (pet): pet is PetInstance => pet !== null && pet.health > 0
  );
  const listeners = friends.flatMap((pet) => {
    const ability = getAbility(petRegistry[pet.type], Trigger.friend_ate_food);
    return ability ? [{ pet, ability }] : [];
  });
  for (const { pet, ability } of orderByAttack(
    listeners,
    (job) => job.pet.attack
  )) {
    ability.fn({
      self: pet,
      fedPet,
      friends,
      level: pet.level,
      foodGroup,
    });
  }
}

// Applies a bought food to the board. Foods with their own `applyEffect`
// (Pill, ...) handle themselves; everything else gives each targeted pet its
// attack/health bonus and, if it's a perk, the perk.
export function applyFoodEffect(
  food: FoodType,
  board: ApiBoard,
  boardPosition: number | undefined,
  petRegistry: Record<string, StaticPet>
): ApiBoard {
  const newBoard = new Board(board).clone().pets;
  if (food.applyEffect) {
    if (boardPosition === undefined) return newBoard;

    const fedPet = newBoard[boardPosition];
    if (fedPet && !food.skipsFriendAteFood) {
      triggerFriendAteFood(newBoard, fedPet, petRegistry, food.foodGroup);
    }
    return food.applyEffect({ board: newBoard, boardPosition, petRegistry });
  }

  // One purchase spends one use, however many pets it feeds (Sushi).
  const multiplier = consumeFoodMultiplier(food, newBoard, petRegistry);
  for (const i of pickTargets(food, new Board(newBoard), boardPosition)) {
    const pet = newBoard[i];
    if (pet) {
      if (isMaxedExperienceTarget(food, pet)) continue;
      const fedPet = applyStandardEffect(food, pet, multiplier);
      newBoard[i] = fedPet;
      if (!food.skipsFriendAteFood) {
        triggerFriendAteFood(newBoard, fedPet, petRegistry, food.foodGroup);
      }
    }
  }

  return newBoard;
}
