import type {
  PetInstance,
  ShopState,
  ShopAbilityContext,
  BattleAbilityContext,
  PetType,
  FoodType,
} from "@/lib/types";
import { pickN, orderByAttack } from "@/lib/utils/random";
import { stockFood } from "@/lib/game/shop";

export type ShopAbilityResult = {
  board: (PetInstance | null)[];
  shop: ShopState;
  goldDelta: number;
};

function cloneShop(shop: ShopState): ShopState {
  return {
    shopPets: shop.shopPets.map((p) => ({ ...p })),
    shopFoods: shop.shopFoods.map((f) => ({ ...f })),
  };
}

export function fireShopAbility(
  trigger: "sell" | "buy" | "level-up",
  pet: PetInstance,
  petIndex: number,
  board: (PetInstance | null)[],
  shop: ShopState,
  petRegistry: Record<string, PetType>,
  _foodRegistry: Record<string, FoodType>
): ShopAbilityResult {
  const def = petRegistry[pet.type];
  if (!def?.ability || def.ability.trigger !== trigger) {
    return { board: [...board], shop, goldDelta: 0 };
  }

  const newBoard = [...board] as (PetInstance | null)[];
  const newShop = cloneShop(shop);
  let goldDelta = 0;
  const justStocked = new Set<object>();

  const ctx: ShopAbilityContext = {
    self: pet,
    selfIndex: petIndex,
    board: newBoard,
    shop: newShop,
    level: pet.level,
    goldGain: (amount) => {
      goldDelta += amount;
    },
    addShopFood: (foodName) => stockFood(newShop, foodName, justStocked),
  };

  def.ability.fn(ctx);
  return { board: newBoard, shop: newShop, goldDelta };
}

// Fires a board-wide trigger ("start-of-turn" / "end-turn") for every pet on
// the board, rather than a single acted-on pet.
export function fireBoardShopAbility(
  trigger: "start-of-turn" | "end-turn",
  board: (PetInstance | null)[],
  shop: ShopState,
  petRegistry: Record<string, PetType>,
  lastBattleResult?: "WIN" | "DRAW" | "LOSS"
): ShopAbilityResult {
  const currentBoard = [...board] as (PetInstance | null)[];
  const currentShop = cloneShop(shop);
  let goldDelta = 0;
  const justStocked = new Set<object>();

  for (let i = 0; i < currentBoard.length; i++) {
    const pet = currentBoard[i];
    if (!pet) continue;

    // Bread is a food-granted effect, not a PetType's own ability, so it's
    // checked here directly rather than via the registry. Its health is
    // temporary: removed at the next start-of-turn even if the perk has since
    // been replaced.
    if (pet.perk === "Bread" && trigger === "end-turn") {
      pet.health += 7;
      pet.tempHealth = (pet.tempHealth ?? 0) + 7;
    }

    if (trigger === "start-of-turn") {
      if (pet.tempAttack) pet.attack -= pet.tempAttack;
      if (pet.tempHealth) pet.health -= pet.tempHealth;
      delete pet.tempAttack;
      delete pet.tempHealth;
    }

    const def = petRegistry[pet.type];
    if (def?.ability?.trigger !== trigger) continue;

    const ctx: ShopAbilityContext = {
      self: pet,
      selfIndex: i,
      board: currentBoard,
      shop: currentShop,
      level: pet.level,
      goldGain: (amount) => {
        goldDelta += amount;
      },
      addShopFood: (foodName) => stockFood(currentShop, foodName, justStocked),
      lastBattleResult,
    };
    def.ability.fn(ctx);
  }

  return { board: currentBoard, shop: currentShop, goldDelta };
}

// Fires the pet at `boardPosition`'s "faint" ability in the shop (used by
// Pill). Faint abilities expect a compacted battle team, so the board is
// compacted just to get correct neighbor/selfIndex math (e.g. Badger's
// splash) — any summon() lands back in the vacated board slot.
export function fireShopFaint(
  board: (PetInstance | null)[],
  boardPosition: number,
  petRegistry: Record<string, PetType>
): (PetInstance | null)[] {
  const newBoard = [...board] as (PetInstance | null)[];
  const pet = newBoard[boardPosition];
  if (!pet) return newBoard;

  const def = petRegistry[pet.type];
  const compacted = newBoard.filter((p): p is PetInstance => p !== null);
  const selfIndex = compacted.indexOf(pet);

  newBoard[boardPosition] = null;

  if (def?.ability?.trigger === "faint") {
    const ctx: BattleAbilityContext = {
      self: pet,
      selfIndex,
      team: compacted,
      enemyTeam: [],
      level: pet.level,
      summon: (newPet) => {
        newBoard[boardPosition] = newPet;
      },
      triggerCount: 1,
      petRegistry,
    };
    def.ability.fn(ctx);
  }

  return newBoard;
}

// Fires "friend-summoned" for every other pet on the board when a pet is
// freshly placed in the shop (i.e. bought into an empty/opened slot, not
// merged into an existing pet — merging levels up a pet, it doesn't summon
// a new one). Reuses the battle-ability context shape/compaction, matching
// how fireShopFaint bridges battle-only triggers into the shop.
export function fireShopFriendSummoned(
  board: (PetInstance | null)[],
  summonedBoardPosition: number,
  petRegistry: Record<string, PetType>
): (PetInstance | null)[] {
  const newBoard = [...board] as (PetInstance | null)[];
  const summonedPet = newBoard[summonedBoardPosition];
  if (!summonedPet) return newBoard;

  const compacted = newBoard.filter((p): p is PetInstance => p !== null);
  const summonedIndex = compacted.indexOf(summonedPet);

  const candidates: {
    pet: PetInstance;
    ability: Extract<PetType["ability"], { trigger: "friend-summoned" }>;
  }[] = [];
  compacted.forEach((pet, i) => {
    if (i === summonedIndex) return;
    const ability = petRegistry[pet.type]?.ability;
    if (ability?.trigger === "friend-summoned") {
      candidates.push({ pet, ability });
    }
  });

  // Same-trigger pets fire highest-attack first (ties random), matching the
  // battle engine's ability-order rule.
  for (const { pet, ability } of orderByAttack(candidates, (c) => c.pet.attack)) {
    const ctx: BattleAbilityContext = {
      self: pet,
      selfIndex: compacted.indexOf(pet),
      team: compacted,
      enemyTeam: [],
      level: pet.level,
      summon: () => {},
      summonedIndex,
      triggerCount: 1,
      petRegistry,
      inShop: true,
    };
    ability.fn(ctx);
  }

  return newBoard;
}

// Gives 3 random board pets +1/+1 (Sushi targets the whole board, not the
// single pet a normal food would be aimed at).
export function applySushiBuff(board: (PetInstance | null)[]): (PetInstance | null)[] {
  const newBoard = [...board] as (PetInstance | null)[];
  const targets = pickN(
    newBoard.filter((p): p is PetInstance => p !== null),
    3
  );
  for (const target of targets) {
    target.attack += 1;
    target.health += 1;
  }
  return newBoard;
}
