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
  triggerCountsThisTurn?: Partial<Record<Trigger, number>>;
  // Friends swallowed this battle (Whale), each already at the level it will
  // be released at.
  swallowedPets?: PetInstance[];
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
  // Attack/health this food gives is multiplied by this (Sugar Glider's
  // Cupcakes). Cat adds to it; see lib/game/food.
  multiplier?: number;
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

export type SummonOptions = {
  // Summon at the front of the opposing team instead of the summoner's own.
  onEnemyTeam?: boolean;
  // Skip friends' "friend summoned" abilities for this summon.
  skipsFriendSummoned?: boolean;
  // Keep the summon queued until its team has room, instead of flinging it.
  waitsForSpace?: boolean;
};

export type SummonRequest = SummonOptions & {
  pet: PetInstance;
  afterIndex: number;
};

// Ability contexts carry only data. Anything an ability *does* with that data
// lives on BattleActions / ShopActions (lib/game/ability-actions), which are
// instantiated from the context.
export type BattleAbilityContext = {
  self: PetInstance;
  selfIndex: number;
  team: PetInstance[];
  enemyTeam: PetInstance[];
  level: number;
  // Summons the ability asked for, placed by whatever fired it.
  summonRequests: SummonRequest[];
  // Pets the ability damaged; their "hurt" abilities fire once it finishes.
  hurtPets: PetInstance[];
  summonedIndex?: number;
  // Where the fainted friend stood, for "friend faints" abilities.
  faintedIndex?: number;
  petRegistry: Record<string, StaticPet>;
  inShop?: boolean;
  // True when the ability is being repeated for the same event (Tiger).
  isRepeat?: boolean;
};

export type FoodAbilityContext = {
  self: PetInstance;
  fedPet: PetInstance;
  friends: PetInstance[];
  level: number;
  foodGroup?: FoodType["foodGroup"];
};

export type TransformedAbilityContext = {
  self: PetInstance;
  // The board's living pets, in board order (self included).
  friends: PetInstance[];
  level: number;
};

export type ShopAbilityContext = {
  self: PetInstance;
  selfIndex: number;
  board: (PetInstance | null)[];
  shop: ShopState;
  level: number;
  gold: { delta: number };
  // Items stocked by the abilities firing together, so a batch never evicts
  // itself.
  justStocked: Set<object>;
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
  friend_hurt,
  friend_faints,
  // Shop food bought (counted for Cat's uses per turn).
  food_bought,
  transformed,
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
  | { trigger: Trigger.knock_out; fn: (ctx: BattleAbilityContext) => void }
  | { trigger: Trigger.friend_hurt; fn: (ctx: BattleAbilityContext) => void }
  | { trigger: Trigger.friend_faints; fn: (ctx: BattleAbilityContext) => void }
  | { trigger: Trigger.transformed; fn: (ctx: TransformedAbilityContext) => void };

export type AbilityData = Pick<Ability, "trigger">;

export type StaticPet = {
  name: string;
  sprite: string;
  tier: number;
  baseAttack: number;
  baseHealth: number;
  isToken: boolean;
  abilities: Map<Trigger, Ability>;
  innatePerk?: BasePerkType | OffensivePerk | DefensivePerk | TriggerPerk | null;
  // Pet types this pet's abilities never activate on (e.g. Fly ignores a
  // fainting Zombie Fly).
  doesNotActivate?: string[];
  // While on the team, each level adds one more helping of shop food
  // attack/health, for the first `usesPerTurn` foods each turn (Cat).
  foodStatMultiplier?: { usesPerTurn: number };
  description: string | ((level: number) => string);
};

export type PetData = Omit<StaticPet, "abilities" | "description"> & {
  abilities: AbilityData[];
  description: string;
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
