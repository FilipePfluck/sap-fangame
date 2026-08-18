import type {
  PetInstance,
  ShopState,
  ShopAbilityContext,
  PetType,
  FoodType,
} from "@/lib/types";

export type ShopAbilityResult = {
  board: (PetInstance | null)[];
  shop: ShopState;
  goldDelta: number;
};

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
  const newShop: ShopState = {
    shopPets: shop.shopPets.map((p) => ({ ...p })),
    shopFoods: [...shop.shopFoods],
  };
  let goldDelta = 0;

  const ctx: ShopAbilityContext = {
    self: pet,
    selfIndex: petIndex,
    board: newBoard,
    shop: newShop,
    level: pet.level,
    goldGain: (amount) => {
      goldDelta += amount;
    },
    addShopFood: (foodName) => {
      newShop.shopFoods.push({ type: foodName, frozen: false });
    },
  };

  def.ability.fn(ctx);
  return { board: newBoard, shop: newShop, goldDelta };
}
