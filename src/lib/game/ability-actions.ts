import {
  DOES_NOT_DECAY,
  isDefensivePerk,
  type BattleAbilityContext,
  type FoodType,
  type PetInstance,
  type ShopAbilityContext,
  type SummonOptions,
} from "@/lib/types";
import { triggerFriendAteFood } from "@/lib/game/food";
import { stockFood, type StockFoodOptions } from "@/lib/game/shop";

// Ability contexts carry only data; these classes are what an ability
// instantiates from its context when it needs to act on that data.

export class BattleActions {
  constructor(private readonly ctx: BattleAbilityContext) {}

  // The only way ability damage is dealt. Garlic/Melon/Coconut reduce it;
  // returns the actual damage dealt. In battle, a pet that loses health is
  // queued to fire its "hurt" ability once this ability finishes.
  // TODO - Ability damage in the shop (e.g. a Pilled Badger hitting Camel)
  // doesn't fire hurt abilities yet.
  dealAbilityDamage(target: PetInstance, damage: number): number {
    if (!this.ctx.inShop && target.health <= 0) return 0;

    const perk = target.perk;
    if (isDefensivePerk(perk) && perk.blocksAbilityDamage) {
      damage = perk.blocksAllDamage
        ? 0
        : Math.max(damage - perk.blocksFor, perk.minimumDamageTaken);
      if (perk.usesRemaining !== DOES_NOT_DECAY) perk.usesRemaining -= 1;
      if (perk.usesRemaining === 0) target.perk = null;
    }

    target.health -= damage;
    if (!this.ctx.inShop && damage > 0) this.ctx.hurtPets.push(target);
    return damage;
  }

  // Queues a summon; whatever fired the ability places it afterwards.
  summon(
    pet: PetInstance,
    afterIndex: number,
    options: SummonOptions = {}
  ): void {
    this.ctx.summonRequests.push({ ...options, pet, afterIndex });
  }

  friendAteFood(fedPet: PetInstance): void {
    triggerFriendAteFood(this.ctx.team, fedPet, this.ctx.petRegistry);
  }
}

export class ShopActions {
  constructor(private readonly ctx: ShopAbilityContext) {}

  goldGain(amount: number): void {
    this.ctx.gold.delta += amount;
  }

  // Adds a food to the shop without removing any (beyond making room).
  // `discount` is the gold knocked off the food's price; `multiplier` scales
  // its attack/health.
  stockShopFood(food: FoodType, options?: StockFoodOptions): void {
    stockFood(this.ctx.shop, food, this.ctx.justStocked, options);
  }

  // Empties the food shop, frozen items included, then stocks `foods`.
  replaceShopFood(foods: FoodType[]): void {
    this.ctx.shop.shopFoods = [];
    for (const food of foods) this.stockShopFood(food);
  }
}
