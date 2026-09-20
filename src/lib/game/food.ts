import type { Board, FoodType, PetInstance, PetType, ShopState } from "@/lib/types";
import { pickN } from "@/lib/utils/random";
import { canGainXp, grantXp } from "@/lib/game/merge";
import { addLevelUpReward } from "@/lib/game/shop";
import { fireShopAbility } from "@/lib/game/shop-ability";

// Whether the player has to pick a pet to feed this food to.
export function needsTarget(food: FoodType): boolean {
  return !food.targeting;
}

// Whether `pet` is a legal target for `food`. Foods that give xp can't
// target pets that are already maxed out (level 3).
export function isValidFoodTarget(food: FoodType, pet: PetInstance): boolean {
  return !food.effect.experience || canGainXp(pet);
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
    return isValidFoodTarget(food, target) ? null : "Level 3 pets can't gain experience";
  }
  return board.some((pet) => pet && isValidFoodTarget(food, pet)) ? null : "No pets to feed";
}

function applyStandardEffect(food: FoodType, pet: PetInstance): PetInstance {
  const fed: PetInstance = {
    ...pet,
    attack: pet.attack + (food.effect.attack ?? 0),
    health: pet.health + (food.effect.health ?? 0),
    perk: food.isPerk ? food.name : pet.perk,
  };
  return food.effect.experience ? grantXp(fed, food.effect.experience) : fed;
}

// Board positions the food acts on: the chosen one, or a random selection of
// valid positions (all of them if there are fewer than asked for).
function pickTargets(food: FoodType, board: Board, boardPosition: number | undefined): number[] {
  if (!food.targeting) return boardPosition === undefined ? [] : [boardPosition];
  const occupied = board.flatMap((pet, i) => (pet && isValidFoodTarget(food, pet) ? [i] : []));
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

// Experience from food can level a pet up just like merging does: each pet
// that gained a level fires its "level-up" ability and stocks the shop
// reward. `before`/`after` are the board around applyFoodEffect.
export function applyFoodLevelUps(
  food: FoodType,
  before: Board,
  after: Board,
  shop: ShopState,
  turn: number,
  petRegistry: Record<string, PetType>,
  rewardPack: PetType[]
): { board: Board; shop: ShopState; goldDelta: number } {
  let board = after;
  let currentShop = shop;
  let goldDelta = 0;
  if (!food.effect.experience) return { board, shop: currentShop, goldDelta };

  for (let i = 0; i < before.length; i++) {
    const old = before[i];
    const pet = after[i];
    if (!old || !pet || pet.level <= old.level) continue;

    // The ability sees the pet's old level, as it does for merges.
    const result = fireShopAbility(
      "level-up",
      { ...pet, level: old.level },
      i,
      board,
      currentShop,
      petRegistry
    );
    board = result.board;
    currentShop = addLevelUpReward(result.shop, turn, rewardPack);
    goldDelta += result.goldDelta;
  }
  return { board, shop: currentShop, goldDelta };
}
