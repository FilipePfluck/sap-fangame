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
  foodTriggersThisTurn?: number;
  friendBuysThisTurn?: number;
  friendAheadFaintsThisTurn?: number;
  friendSummonsThisTurn?: number;
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

export type BuyResponse = {
  success: boolean;
  wasSummoned: boolean;
  levelUpReward: boolean;
  error?: Error;
}

export type ApiBoard = (PetInstance | null)[]

export type ShopState = {
  shopPets: ShopPet[];
  shopFoods: ShopFood[];
};

export type BattleStep = {
  attackerTeam: PetInstance[];
  defenderTeam: PetInstance[];
  description: string;
};

export enum AbilityMode {
  battle = "battle",
  shop = "shop",
}
export type ModeValue<T> = Record<AbilityMode, T>;
export type PetStatChanges = Partial<Pick<PetInstance, "attack" | "health">>;
export type PetSnapshot = Pick<PetInstance, "type" | "attack" | "health">;
export type AbilityStateKey = string | number | symbol;
export type AbilityState = {
  get<T>(key: AbilityStateKey): T | undefined;
  set<T>(key: AbilityStateKey, value: T): void;
};

export type BattleAbilityContext = {
  self: PetInstance;
  selfIndex: number;
  team: PetInstance[];
  enemyTeam: PetInstance[];
  level: number;
  mode: AbilityMode;
  resolveValue: <T>(values: ModeValue<T>) => T;
  modifyStats: (target: PetInstance, changes: PetStatChanges) => void;
  swallowFriendAhead: () => PetSnapshot | undefined;
  state: AbilityState;
  summon: (pet: PetInstance, afterIndex: number, options?: SummonOptions) => void;
  summonedIndex?: number;
  faintedIndex?: number;
  triggerCount: number;
  petRegistry: Record<string, StaticPet>;
  dealAbilityDamage: (target: PetInstance, damage: number) => number;
  grantExperience: (target: PetInstance, amount: number) => void;
  friendAteFood: (fedPet: PetInstance) => void;
};

export type SummonOptions = {
  side?: "self" | "enemy";
  triggerFriendSummoned?: boolean;
  waitForSpace?: boolean;
};

export type FoodAbilityContext = {
  self: PetInstance;
  fedPet: PetInstance;
  friends: PetInstance[];
  level: number;
  foodGroup?: FoodType["foodGroup"];
};

export type ShopAbilityContext = {
  self: PetInstance;
  selfIndex: number;
  board: (PetInstance | null)[];
  shop: ShopState;
  level: number;
  goldGain: (amount: number) => void;
  addShopFood: (foodName: string, discount?: number) => void;
  grantExperience: (target: PetInstance, amount: number) => void;
  lastBattleResult?: "WIN" | "DRAW" | "LOSS";
  boughtPet?: StaticPet;
};

export enum Trigger {
  sell,
  buy,
  faint,
  start_of_battle,
  level_up,
  friend_summoned,
  friend_faints,
  start_of_turn,
  end_turn,
  before_attack,
  after_attack,
  knock_out,
  hurt,
  friend_ahead_attacks,
  friend_ate_food,
  friend_bought,
  friend_ahead_faints,
  counter,
}

export enum CounterTrigger {
  friend_hurt,
}

export type CounterCondition = {
  trigger: CounterTrigger.friend_hurt;
  every: number;
}

export type Ability =
  | { trigger: Trigger.sell; fn: (ctx: ShopAbilityContext) => void }
  | { trigger: Trigger.buy; fn: (ctx: ShopAbilityContext) => void }
  | { trigger: Trigger.faint; fn: (ctx: BattleAbilityContext) => void }
  | { trigger: Trigger.start_of_battle; fn: (ctx: BattleAbilityContext) => void }
  | { trigger: Trigger.level_up; fn: (ctx: ShopAbilityContext) => void }
  | { trigger: Trigger.friend_summoned; fn: (ctx: BattleAbilityContext) => void }
  | { trigger: Trigger.friend_faints; fn: (ctx: BattleAbilityContext) => void }
  | { trigger: Trigger.start_of_turn; fn: (ctx: ShopAbilityContext) => void }
  | { trigger: Trigger.end_turn; fn: (ctx: ShopAbilityContext) => void }
  | { trigger: Trigger.before_attack; fn: (ctx: BattleAbilityContext) => void }
  | { trigger: Trigger.after_attack; fn: (ctx: BattleAbilityContext) => void }
  | { trigger: Trigger.hurt; fn: (ctx: BattleAbilityContext) => void }
  | { trigger: Trigger.friend_ahead_attacks; fn: (ctx: BattleAbilityContext) => void }
  | { trigger: Trigger.friend_ahead_faints; fn: (ctx: BattleAbilityContext) => void }
  | { trigger: Trigger.counter; counter: CounterCondition; fn: (ctx: BattleAbilityContext) => void }
  | { trigger: Trigger.friend_ate_food; fn: (ctx: FoodAbilityContext) => void }
  | { trigger: Trigger.friend_bought; fn: (ctx: ShopAbilityContext) => void }
  | { trigger: Trigger.knock_out; fn: (ctx: BattleAbilityContext) => void };

export type StaticPet = {
  name: string;
  sprite: string;
  tier: number;
  baseAttack: number;
  baseHealth: number;
  isToken: boolean;
  ability: Ability | null;
  additionalAbilities?: Ability[];
  innatePerk?: BasePerkType | OffensivePerk | DefensivePerk | TriggerPerk | null;
  ignoresFriendFaintsFrom?: string[];
  description: string | ((level: number) => string);
};

export type FoodApplyContext = {
  board: ApiBoard;
  boardPosition: number;
  petRegistry: Record<string, StaticPet>;
};

export type FoodType = {
  name: string;
  sprite: string;
  tier: number;
  foodGroup?: "apple";
  perk?: BasePerkType | OffensivePerk | DefensivePerk | TriggerPerk | null;
  isToken: boolean;
  cost?: number;
  effect: {
    attack?: number;
    health?: number;
    experience?: number;
    // Attack/health last until the start of next turn.
    temporary?: boolean;
  };
  // Foods that pick their own random targets instead of the player choosing
  // one (e.g. Sushi). Unset means the player picks a pet to feed.
  targeting?: { random: number };
  skipsFriendAteFood?: boolean;
  // Overrides the standard "apply effect/perk to the targeted pet" behavior
  // for foods that don't fit it (e.g. Pill). Returns a new board and
  // must not mutate the one it's given.
  applyEffect?: (ctx: FoodApplyContext) => ApiBoard;
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
  blocksAllDamage?: boolean,
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
