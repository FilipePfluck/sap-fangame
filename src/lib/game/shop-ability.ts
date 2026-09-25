import {
  Ability,
  BattleAbilityContext,
  isTriggerPerk,
  PetInstance,
  PetType,
  ShopAbilityContext,
  ShopState,
  Trigger,
} from "@/lib/types";
import { orderByAttack } from "@/lib/utils/random";
import { stockFood } from "@/lib/game/shop";
import { compactBoard, grantExperience } from "@/lib/game/merge";
import { friendSummonedCandidates } from "@/lib/game/friend-summoned";
import { triggerEffect } from "@/lib/perks/trigger-functions";
import { dealAbilityDamage } from "@/lib/utils/combat";
import { triggerFriendAteFood } from "@/lib/game/food";

export type ShopAbilityResult = {
  board: (PetInstance | null)[];
  shop: ShopState;
  goldDelta: number;
};

type FriendBoughtAbility = Extract<Ability, { trigger: Trigger.friend_bought }>;

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
  boughtPetTier?: number
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
    grantExperience,
    lastBattleResult,
    boughtPetTier,
  };
}

function clearTempStats(pet: PetInstance): void {
  if (pet.tempAttack) pet.attack -= pet.tempAttack;
  if (pet.tempHealth) pet.health -= pet.tempHealth;
  delete pet.tempAttack;
  delete pet.tempHealth;
}

export function fireShopAbility(
  trigger: Trigger.sell | Trigger.buy | Trigger.level_up,
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

  def.ability.fn(
    createShopContext(pet, petIndex, newBoard, newShop, gold, new Set())
  );
  return { board: newBoard, shop: newShop, goldDelta: gold.delta };
}

// Fires a board-wide trigger ("start-of-turn" / "end-turn") for every pet on
// the board, rather than a single acted-on pet.
export function fireBoardShopAbility(
  trigger: Trigger.start_of_turn | Trigger.end_turn,
  board: (PetInstance | null)[],
  shop: ShopState,
  petRegistry: Record<string, PetType>,
  lastBattleResult?: "WIN" | "DRAW" | "LOSS"
): ShopAbilityResult {
  const currentBoard = [...board];
  const currentShop = cloneShop(shop);
  const gold = { delta: 0 };
  const justStocked = new Set<object>();
  type Job = {
    pet: PetInstance;
    index: number;
    perk: Extract<PetInstance["perk"], { trigger: Trigger }> | null;
    ability: Extract<Ability, { trigger: Trigger.start_of_turn | Trigger.end_turn }> | null;
  };
  const jobs: Job[] = [];

  for (let i = 0; i < currentBoard.length; i++) {
    const pet = currentBoard[i];
    if (!pet) continue;

    if (trigger === Trigger.start_of_turn) {
      clearTempStats(pet);
      delete pet.foodTriggersThisTurn;
      delete pet.friendBuysThisTurn;
    }

    const perk = isTriggerPerk(pet.perk) && pet.perk.trigger === trigger
      ? pet.perk
      : null;
    const ability = petRegistry[pet.type]?.ability;
    const petAbility = ability?.trigger === trigger ? ability : null;
    if (pet.health > 0 && (perk || petAbility)) {
      jobs.push({ pet, index: i, perk, ability: petAbility });
    }
  }

  for (const { pet, index, perk, ability } of orderByAttack(
    jobs,
    (job) => job.pet.attack
  )) {
    if (pet.health <= 0) continue;
    if (perk) triggerEffect(perk, { self: pet });
    if (ability) {
      ability.fn(
        createShopContext(
          pet,
          index,
          currentBoard,
          currentShop,
          gold,
          justStocked,
          lastBattleResult
        )
      );
    }
  }

  return { board: currentBoard, shop: currentShop, goldDelta: gold.delta };
}

export function fireShopFriendBought(
  boughtPetTier: number,
  board: (PetInstance | null)[],
  shop: ShopState,
  petRegistry: Record<string, PetType>
): ShopAbilityResult {
  const currentBoard = [...board];
  const currentShop = cloneShop(shop);
  const gold = { delta: 0 };
  if (boughtPetTier !== 1) {
    return { board: currentBoard, shop: currentShop, goldDelta: 0 };
  }

  const justStocked = new Set<object>();
  const listeners: { pet: PetInstance; index: number; ability: FriendBoughtAbility }[] = [];
  for (let i = 0; i < currentBoard.length; i++) {
    const pet = currentBoard[i];
    const ability = pet && petRegistry[pet.type]?.ability;
    if (!pet || pet.health <= 0 || ability?.trigger !== Trigger.friend_bought) continue;
    listeners.push({ pet, index: i, ability });
  }
  for (const { pet, index, ability } of orderByAttack(
    listeners,
    (job) => job.pet.attack
  )) {
    if (pet.health <= 0) continue;
    ability.fn(
      createShopContext(
        pet,
        index,
        currentBoard,
        currentShop,
        gold,
        justStocked,
        undefined,
        boughtPetTier
      )
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
  let newBoard = board.map((p) => (p ? { ...p } : null));
  const pet = newBoard[boardPosition];
  if (!pet) return newBoard;

  const def = petRegistry[pet.type];
  const compacted = compactBoard(newBoard);
  const selfIndex = compacted.indexOf(pet);

  newBoard[boardPosition] = null;
  const summonRequests: PetInstance[] = [];

  if (def?.ability?.trigger === Trigger.faint) {
    const ctx: BattleAbilityContext = {
      self: pet,
      selfIndex,
      team: compacted,
      enemyTeam: [],
      level: pet.level,
      summon: (newPet) => summonRequests.push(newPet),
      triggerCount: 1,
      petRegistry,
      friendAteFood: (fedPet) =>
        triggerFriendAteFood(compacted, fedPet, petRegistry),
      dealAbilityDamage,
      grantExperience,
    };
    def.ability.fn(ctx);
  }

  if (isTriggerPerk(pet.perk) && pet.perk.trigger === Trigger.faint) {
    const summonRequest = triggerEffect(pet.perk, { self: pet }).summonRequest;
    if (summonRequest) summonRequests.push(summonRequest);
  }

  // Pill frees one slot, so any later summon requests are flung.
  for (const summon of summonRequests) {
    if (newBoard[boardPosition] !== null) break;
    newBoard[boardPosition] = summon;
    newBoard = fireShopFriendSummoned(newBoard, boardPosition, petRegistry);
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
  const candidates = friendSummonedCandidates(
    compacted,
    summonedIndex,
    petRegistry
  );

  // Same-trigger pets fire highest-attack first (ties random), matching the
  // battle engine's ability-order rule.
  for (const { pet, ability } of orderByAttack(
    candidates,
    (c) => c.pet.attack
  )) {
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
      dealAbilityDamage,
      grantExperience,
      friendAteFood: (fedPet) =>
        triggerFriendAteFood(compacted, fedPet, petRegistry),
      inShop: true,
    };
    ability.fn(ctx);
  }

  return newBoard;
}
