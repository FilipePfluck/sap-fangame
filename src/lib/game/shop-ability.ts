import type {
  PetInstance,
  ShopState,
  ShopAbilityContext,
  BattleAbilityContext,
  PetType,
} from "@/lib/types";
import { orderByAttack } from "@/lib/utils/random";
import { stockFood } from "@/lib/game/shop";
import { compactBoard } from "@/lib/game/merge";
import { friendSummonedCandidates } from "@/lib/game/friend-summoned";
import { hasTigerBehind, TIGER_REPEAT_LEVEL } from "@/lib/game/tiger";

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

function createShopContext(
  self: PetInstance,
  selfIndex: number,
  board: (PetInstance | null)[],
  shop: ShopState,
  gold: { delta: number },
  justStocked: Set<object>,
  lastBattleResult?: "WIN" | "DRAW" | "LOSS",
  level: number = self.level
): ShopAbilityContext {
  return {
    self,
    selfIndex,
    board,
    shop,
    level,
    goldGain: (amount) => {
      gold.delta += amount;
    },
    addShopFood: (foodName) => stockFood(shop, foodName, justStocked),
    lastBattleResult,
  };
}

function clearTempStats(pet: PetInstance): void {
  if (pet.tempAttack) pet.attack -= pet.tempAttack;
  if (pet.tempHealth) pet.health -= pet.tempHealth;
  delete pet.tempAttack;
  delete pet.tempHealth;
}

export function fireShopAbility(
  trigger: "sell" | "buy" | "level-up",
  pet: PetInstance,
  petIndex: number,
  board: (PetInstance | null)[],
  shop: ShopState,
  petRegistry: Record<string, PetType>
): ShopAbilityResult {
  const def = petRegistry[pet.type];
  if (!def?.ability || def.ability.trigger !== trigger) {
    return { board: [...board], shop, goldDelta: 0 };
  }

  const newBoard = [...board];
  const newShop = cloneShop(shop);
  const gold = { delta: 0 };

  // Tiger repeats the ability once more at level 1 (see hasTigerBehind).
  const repeats = hasTigerBehind(newBoard, petIndex);
  const justStocked = new Set<object>();
  def.ability.fn(createShopContext(pet, petIndex, newBoard, newShop, gold, justStocked));
  if (repeats) {
    def.ability.fn(
      createShopContext(pet, petIndex, newBoard, newShop, gold, justStocked, undefined, TIGER_REPEAT_LEVEL)
    );
  }
  return { board: newBoard, shop: newShop, goldDelta: gold.delta };
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
  const currentBoard = [...board];
  const currentShop = cloneShop(shop);
  const gold = { delta: 0 };
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

    if (trigger === "start-of-turn") clearTempStats(pet);

    const def = petRegistry[pet.type];
    if (def?.ability?.trigger !== trigger) continue;

    const repeats = hasTigerBehind(currentBoard, i);
    def.ability.fn(
      createShopContext(pet, i, currentBoard, currentShop, gold, justStocked, lastBattleResult)
    );
    if (repeats) {
      def.ability.fn(
        createShopContext(
          pet, i, currentBoard, currentShop, gold, justStocked, lastBattleResult, TIGER_REPEAT_LEVEL
        )
      );
    }
  }

  return { board: currentBoard, shop: currentShop, goldDelta: gold.delta };
}

function nearestFreeSlot(board: (PetInstance | null)[], from: number): number {
  for (let d = 1; d < board.length; d++) {
    if (from - d >= 0 && board[from - d] === null) return from - d;
    if (from + d < board.length && board[from + d] === null) return from + d;
  }
  return -1;
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
  // Faint abilities can buff other pets in place, so work on copies.
  const newBoard = board.map((p) => (p ? { ...p } : null));
  const pet = newBoard[boardPosition];
  if (!pet) return newBoard;

  const def = petRegistry[pet.type];
  const compacted = compactBoard(newBoard);
  const selfIndex = compacted.indexOf(pet);

  newBoard[boardPosition] = null;

  if (def?.ability?.trigger === "faint") {
    // A Tiger behind repeats the ability; its summon lands in the nearest
    // free slot if the vacated one is already taken.
    const repeats = hasTigerBehind(compacted, selfIndex);
    const summon = (newPet: PetInstance) => {
      const slot = newBoard[boardPosition] === null ? boardPosition : nearestFreeSlot(newBoard, boardPosition);
      if (slot !== -1) newBoard[slot] = newPet;
    };
    const ctx: BattleAbilityContext = {
      self: pet,
      selfIndex,
      team: compacted,
      enemyTeam: [],
      level: pet.level,
      summon,
      triggerCount: 1,
      petRegistry,
    };
    def.ability.fn(ctx);
    if (repeats) def.ability.fn({ ...ctx, level: TIGER_REPEAT_LEVEL, triggerCount: 2 });
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
  const newBoard = [...board];
  const summonedPet = newBoard[summonedBoardPosition];
  if (!summonedPet) return newBoard;

  const compacted = compactBoard(newBoard);
  const summonedIndex = compacted.indexOf(summonedPet);
  const candidates = friendSummonedCandidates(compacted, summonedIndex, petRegistry);

  // Same-trigger pets fire highest-attack first (ties random), matching the
  // battle engine's ability-order rule.
  for (const { pet, ability } of orderByAttack(candidates, (c) => c.pet.attack)) {
    const selfIndex = compacted.indexOf(pet);
    const repeats = hasTigerBehind(compacted, selfIndex);
    const ctx: BattleAbilityContext = {
      self: pet,
      selfIndex,
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
    if (repeats) ability.fn({ ...ctx, level: TIGER_REPEAT_LEVEL, triggerCount: 2 });
  }

  return newBoard;
}
