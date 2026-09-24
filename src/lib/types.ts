export type PetInstance = {
  type: string;
  attack: number;
  health: number;
  perk: BasePerkType | OffensivePerk | DefensivePerk | TriggerPerk | null;
  xp: number;
  level: number;
  // TODO - Retrofit tests to remove "optional" tag
  sellValue?: number;
  // Portions of attack/health already included above that are removed at the
  // start of the next turn (e.g. Horse's shop buff).
  tempAttack?: number;
  tempHealth?: number;
};

export type ShopPet = {
  type: string;
  frozen: boolean;
  tempHealthBonus?: number;
  // Gold knocked off this item's price (set by abilities); see lib/game/costs.
  discount?: number;
  // Shop pets sharing a chainId are a level-up reward: buying one removes the rest.
  chainId?: string;
};

export type ShopFood = {
  type: string;
  frozen: boolean;
  // Gold knocked off this item's price (set by abilities); see lib/game/costs.
  discount?: number;
};

export type Board = (PetInstance | null)[];

export type ShopState = {
  shopPets: ShopPet[];
  shopFoods: ShopFood[];
};

export type BattleStep = {
  attackerTeam: PetInstance[];
  defenderTeam: PetInstance[];
  description: string;
};

export type BattleAbilityContext = {
  self: PetInstance;
  selfIndex: number;
  team: PetInstance[];
  enemyTeam: PetInstance[];
  level: number;
  summon: (pet: PetInstance, afterIndex: number) => void;
  summonedIndex?: number;
  triggerCount: number;
  petRegistry: Record<string, PetType>;
  inShop?: boolean;
};

export type ShopAbilityContext = {
  self: PetInstance;
  selfIndex: number;
  board: (PetInstance | null)[];
  shop: ShopState;
  level: number;
  goldGain: (amount: number) => void;
  addShopFood: (foodName: string) => void;
  lastBattleResult?: "WIN" | "DRAW" | "LOSS";
};

export enum Trigger {
  sell,
  buy,
  faint,
  start_of_battle,
  level_up,
  friend_summoned,
  start_of_turn,
  end_turn,
  before_attack,
  after_attack,
  knock_out,
}

export type Ability =
  | { trigger: Trigger.sell; fn: (ctx: ShopAbilityContext) => void }
  | { trigger: Trigger.buy; fn: (ctx: ShopAbilityContext) => void }
  | { trigger: Trigger.faint; fn: (ctx: BattleAbilityContext) => void }
  | { trigger: Trigger.start_of_battle; fn: (ctx: BattleAbilityContext) => void }
  | { trigger: Trigger.level_up; fn: (ctx: ShopAbilityContext) => void }
  | { trigger: Trigger.friend_summoned; fn: (ctx: BattleAbilityContext) => void }
  | { trigger: Trigger.start_of_turn; fn: (ctx: ShopAbilityContext) => void }
  | { trigger: Trigger.end_turn; fn: (ctx: ShopAbilityContext) => void }
  | { trigger: Trigger.before_attack; fn: (ctx: BattleAbilityContext) => void }
  | { trigger: Trigger.knock_out; fn: (ctx: BattleAbilityContext) => void };

export type PetType = {
  name: string;
  sprite: string;
  tier: number;
  baseAttack: number;
  baseHealth: number;
  isToken: boolean;
  ability: Ability | null;
  innatePerk?: BasePerkType | OffensivePerk | DefensivePerk | TriggerPerk | null;
  description: string | ((level: number) => string);
};

export type FoodApplyContext = {
  board: Board;
  boardPosition: number;
  petRegistry: Record<string, PetType>;
};

export type FoodType = {
  name: string;
  sprite: string;
  tier: number;
  perk?: BasePerkType | OffensivePerk | DefensivePerk | TriggerPerk | null;
  isToken: boolean;
  cost?: number;
  effect: { attack?: number; health?: number };
  // Foods that pick their own random targets instead of the player choosing
  // one (e.g. Sushi). Unset means the player picks a pet to feed.
  targeting?: { random: number };
  // Overrides the standard "apply effect/perk to the targeted pet" behavior
  // for foods that don't fit it (e.g. Pill). Returns a new board and
  // must not mutate the one it's given.
  applyEffect?: (ctx: FoodApplyContext) => Board;
  description: string;
};

export const DOES_NOT_DECAY = -1

export type BasePerkType = {
  name: string;
  description: string;
  usesRemaining: number;
}

export interface OffensivePerk extends BasePerkType {
  instantKill: boolean,
  extraDamage: number,
}

export interface DefensivePerk extends BasePerkType {
  blocksFor: number,
  minimumDamageTaken: number,
  blocksAbilityDamage: boolean,
  blocksDirectDamage: boolean,
}

export interface TriggerPerk extends BasePerkType {
  trigger: Trigger;
}

export function isOffensivePerk(object: BasePerkType | null): object is OffensivePerk {
  if (object === null) return false;
  try {
    return 'extraDamage' in object;
  } catch {
    return false;
  }
}

export function isDefensivePerk(object: BasePerkType | null): object is DefensivePerk {
  if (object === null) return false;
  try {
    return 'blocksFor' in object;
  } catch {
    return false;
  }
}

export function isTriggerPerk(object: BasePerkType | null): object is TriggerPerk {
  if (object === null) return false;
  try {
    return "trigger" in object;
  } catch {
    return false;
  }
}
