export type PetInstance = {
  type: string;
  attack: number;
  health: number;
  perk: string | null;
  xp: number;
  level: number;
};

export type ShopPet = {
  type: string;
  frozen: boolean;
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

export type PetType = {
  name: string;
  sprite: string;
  tier: number;
  baseAttack: number;
  baseHealth: number;
  ability: null;
};

export type FoodType = {
  name: string;
  sprite: string;
  tier: number;
  isPerk: boolean;
  effect: { attack?: number; health?: number };
};
