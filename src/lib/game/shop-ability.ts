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
  lastBattleResult?: "WIN" | "DRAW" | "LOSS"
): ShopAbilityContext {
  return {
    self,
    selfIndex,
    board,
    shop,
    level: self.level,
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

  def.ability.fn(createShopContext(pet, petIndex, newBoard, newShop, gold, new Set()));
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

    def.ability.fn(
      createShopContext(pet, i, currentBoard, currentShop, gold, justStocked, lastBattleResult)
    );
  }

  return { board: currentBoard, shop: currentShop, goldDelta: gold.delta };
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

  // Anything the faint ability summoned into the vacated slot arrives now.
  return newBoard[boardPosition]
    ? fireShopSummoned(newBoard, boardPosition, petRegistry)
    : newBoard;
}

// Fires the pet's own "summoned" ability for the pet at `position` in the
// shop (a pet bought into a slot, or summoned by Pill). Like the other shop
// bridges it reuses the battle context over the compacted board. The ability
// acts on the board's pet in place, so callers holding that pet see the
// change; merging into an existing pet never calls this.
export function fireShopSummoned(
  board: (PetInstance | null)[],
  position: number,
  petRegistry: Record<string, PetType>
): (PetInstance | null)[] {
  const newBoard = [...board];
  const pet = newBoard[position];
  const ability = pet ? petRegistry[pet.type]?.ability : null;
  if (!pet || ability?.trigger !== "summoned") return newBoard;

  const compacted = compactBoard(newBoard);
  const selfIndex = compacted.indexOf(pet);
  ability.fn({
    self: pet,
    selfIndex,
    team: compacted,
    enemyTeam: [],
    level: pet.level,
    summon: () => {},
    summonedIndex: selfIndex,
    triggerCount: 1,
    petRegistry,
    inShop: true,
  });
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
