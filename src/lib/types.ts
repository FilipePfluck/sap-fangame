export type PetData = {
  type: string;

  attack: number;
  health: number;
  maxAttack?: number;
  maxHealth?: number;

  perk: BasePerkType | OffensivePerk | DefensivePerk | TriggerPerk | null;

  xp: number;
  level: number;

  // TODO - Retrofit tests to remove "optional" tag
  sellValue?: number;

  tempAttack?: number;
  tempHealth?: number;

  triggers?: number;
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
  newLevel?: number;
  error?: Error;
}

export type ApiBoard = (PetData | null)[]

export type ShopState = {
  shopPets: ShopPet[];
  shopFoods: ShopFood[];
};

export type BattleStep = {
  attackerTeam: PetData[];
  defenderTeam: PetData[];
  description: string;
};

export type BattleAbilityContext = {
  self: PetData;
  selfIndex: number;
  team: PetData[];
  enemyTeam: PetData[];
  level: number;
  summon: (pet: PetData, afterIndex: number) => void;
  summonedIndex?: number;
  triggerCount: number;
  petRegistry: Record<string, StaticPet>;
  dealAbilityDamage: (target: PetData, damage: number) => number;
  grantExperience: (target: PetData, amount: number) => void;
  friendAteFood: (fedPet: PetData) => void;
  inShop?: boolean;
};

export type FoodAbilityContext = {
  self: PetData;
  fedPet: PetData;
  friends: PetData[];
  level: number;
};

export type ShopAbilityContext = {
  self: PetData;
  selfIndex: number;
  board: (PetData | null)[];
  shop: ShopState;
  level: number;
  goldGain: (amount: number) => void;
  addShopFood: (foodName: string) => void;
  grantExperience: (target: PetData, amount: number) => void;
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
  | { trigger: Trigger.after_attack; fn: (ctx: BattleAbilityContext) => void }
  | { trigger: Trigger.hurt; fn: (ctx: BattleAbilityContext) => void }
  | { trigger: Trigger.friend_ahead_attacks; fn: (ctx: BattleAbilityContext) => void }
  | { trigger: Trigger.friend_ahead_faints; fn: (ctx: BattleAbilityContext) => void }
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
  innatePerk?: BasePerkType | OffensivePerk | DefensivePerk | TriggerPerk | null;
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

export interface BasePerkType {
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

export enum DamageType {
  UNDEFINED,
  DIRECT,
  ABILITY,
}