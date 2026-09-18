export type PetInstance = {
  type: string;
  attack: number;
  health: number;
  perk: string | null;
  xp: number;
  level: number;
  // Portions of attack/health already included above that are removed at the
  // start of the next turn (e.g. Horse's shop buff).
  tempAttack?: number;
  tempHealth?: number;
};

export type ShopPet = {
  type: string;
  frozen: boolean;
  tempHealthBonus?: number;
  // Shop pets sharing a chainId are a level-up reward: buying one removes the rest.
  chainId?: string;
};

export type ShopFood = {
  type: string;
  frozen: boolean;
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

export type Ability =
  | { trigger: "sell"; fn: (ctx: ShopAbilityContext) => void }
  | { trigger: "buy"; fn: (ctx: ShopAbilityContext) => void }
  | { trigger: "faint"; fn: (ctx: BattleAbilityContext) => void }
  | { trigger: "start-of-battle"; fn: (ctx: BattleAbilityContext) => void }
  | { trigger: "level-up"; fn: (ctx: ShopAbilityContext) => void }
  | { trigger: "friend-summoned"; fn: (ctx: BattleAbilityContext) => void }
  | { trigger: "start-of-turn"; fn: (ctx: ShopAbilityContext) => void }
  | { trigger: "end-turn"; fn: (ctx: ShopAbilityContext) => void }
  | { trigger: "before-attack"; fn: (ctx: BattleAbilityContext) => void }
  | { trigger: "knock-out"; fn: (ctx: BattleAbilityContext) => void };

export type PetType = {
  name: string;
  sprite: string;
  tier: number;
  baseAttack: number;
  baseHealth: number;
  isToken: boolean;
  ability: Ability | null;
  innatePerk?: string;
  description: string | ((level: number) => string);
};

export type FoodType = {
  name: string;
  sprite: string;
  tier: number;
  isPerk: boolean;
  isToken: boolean;
  cost?: number;
  effect: { attack?: number; health?: number };
  description: string;
};
