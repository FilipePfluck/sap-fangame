import {
  type BattleAbilityContext,
  type FoodType,
  type PetInstance,
  type ShopAbilityContext,
  type SummonOptions,
} from "@/lib/types";
import { triggerFriendAteFood } from "@/lib/game/food";
import { stockFood } from "@/lib/game/shop";
import { dealAbilityDamage } from "@/lib/utils/combat";

// Ability contexts carry only data; these classes are what an ability
// instantiates from its context when it needs to act on that data.

export class BattleActions {
  constructor(private readonly ctx: BattleAbilityContext) {}

  // Returns the actual (post-mitigation) damage dealt. In battle, a pet that
  // loses health is queued to fire its "hurt" ability once this one finishes.
  dealAbilityDamage(target: PetInstance, damage: number): number {
    if (this.ctx.inShop) return dealAbilityDamage(target, damage);
    if (target.health <= 0) return 0;

    const healthBefore = target.health;
    const dealt = dealAbilityDamage(target, damage);
    if (target.health < healthBefore) this.ctx.hurtPets.push(target);
    return dealt;
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

  // `discount` is the gold knocked off the food's price.
  addShopFood(food: FoodType, discount = 0): void {
    stockFood(this.ctx.shop, food, this.ctx.justStocked, discount);
  }
}
