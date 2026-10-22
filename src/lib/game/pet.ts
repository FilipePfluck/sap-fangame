import { BattleAbilityContext, DamageType, PetData, StaticPet, Trigger, } from "@/lib/types";
import { PET_REGISTRY } from "@/lib/pets";
import { decayPerk, isDefensivePerk, isOffensivePerk, isPerkUsed, } from "@/lib/game/perk";
import { MAX_PET_EXPERIENCE } from "@/lib/game/rules";

type FriendAheadTrigger =
  Trigger.friend_ahead_attacks | Trigger.friend_ahead_faints

export class PetInstance {
  data: PetData

  static fromType(type: string): PetInstance {
    const staticPet = PET_REGISTRY[type]
    return new PetInstance({
      type,

      attack: staticPet.baseAttack,
      health: staticPet.baseHealth,
      tempAttack: 0,
      tempHealth: 0,
      maxAttack: 50,
      maxHealth: 50,

      // TODO: Move level to be purely derived from XP, rather than a separate stat
      level: 1,
      xp: 0,

      perk: null,
    })
  }

  constructor(data: PetData) {
    this.data = {
      tempAttack: 0,
      tempHealth: 0,
      maxAttack: 50,
      maxHealth: 50,
      ...data
    }
    this.clampStats()
  }

  addStats(value: [number, number]) {
    this.addAttack(value[0])
    this.addHealth(value[1])
  }

  addAttack(value: number) {
    this.data.attack += value
    this.clampStats()
  }

  // Note: Do not implement lower bound.  Negative health caused by damage is relevant for recoil abilities.
  addHealth(value: number) {
    this.data.health += value
    this.clampStats()
  }

  addTempAttack(value: number) {
    this.data.tempAttack = this.data.tempAttack ?? 0 // TODO: Remove after making tempAttack a required field
    this.data.tempAttack += value
    this.clampStats()
  }

  addTempHealth(value: number) {
    this.data.tempHealth = this.data.tempHealth ?? 0; // TODO: Remove after making tempHealth a required field
    this.data.tempHealth += value;
    this.clampStats();
  }

  // Returns the amount of XP successfully added
  addXp(value: number): number {
    const toAdd = Math.min(MAX_PET_EXPERIENCE - this.data.xp, value)
    this.data.xp += toAdd

    // Always add full stats provided by XP, even if all XP cannot be granted
    this.addStats([value, value])
    return toAdd
  }

  setStats(value: [number, number]): void {
    this.data.attack = value[0]
    this.data.health = value[1]
    this.clampStats()
  }

  clearTemporaryStats() {
    this.data.tempAttack = 0
    this.data.tempHealth = 0
  }

  clampStats() {
    this.data.maxAttack = this.data.maxAttack ?? 50 // TODO: Remove after making maxAttack a required field
    this.data.maxHealth = this.data.maxHealth ?? 50 // TODO: Remove after making maxHealth a required field
    this.data.tempAttack = this.data.tempAttack ?? 0 // TODO: Remove after making tempAttack a required field
    this.data.tempHealth = this.data.tempHealth ?? 0 // TODO: Remove after making tempHealth a required field

    this.data.attack = Math.min(this.data.attack, this.data.maxAttack)
    const overflowAttack =
      this.data.maxAttack - (this.data.attack + this.data.tempAttack)
    this.data.tempAttack = Math.min(this.data.tempAttack, overflowAttack)

    this.data.health = Math.min(this.data.health, this.data.maxHealth)
    const overflowHealth =
      this.data.maxHealth - (this.data.health + this.data.tempHealth)
    this.data.tempHealth = Math.min(this.data.tempHealth, overflowHealth)
  }

  getAttack() {
    return this.data.attack + (this.data.tempAttack ?? 0) // TODO: Remove after making tempAttack a required field
  }

  getHealth() {
    return this.data.health + (this.data.tempHealth ?? 0) // TODO: Remove after making tempHealth a required field
  }

  // Returns value removed
  removeHealth(value: number) {
    const toRemove = Math.min(value, this.data.health - 1)
    this.data.health -= toRemove
    return toRemove
  }

  // Get attack damage based on offensive perk properties.
  // NOTE: This INTENTIONALLY decays offensive perks
  dealDamage(value: number) {
    if (isOffensivePerk(this.data.perk)) {
      value += this.data.perk.extraDamage
      this.data.perk = decayPerk(this.data.perk)
    }

    return value;
  }

  // Applies damage based on defensive perk properties.  Returns damage taken.
  takeDamage(value: number, type: DamageType): number {
    if (type === DamageType.UNDEFINED)
      throw new Error("DamageType is not specified.")

    if (isDefensivePerk(this.data.perk) && isPerkUsed(type, this.data.perk)) {
      const minimumDamage = Math.min(value, this.data.perk.minimumDamageTaken)
      value = Math.max(value - this.data.perk.blocksFor, minimumDamage)
      this.data.perk = decayPerk(this.data.perk)
    }

    this.addHealth(-value)
    return value
  }
}

export function friendAheadAbility(
  pet: PetData | undefined,
  trigger: FriendAheadTrigger,
  petRegistry: Record<string, StaticPet>
): ((ctx: BattleAbilityContext) => void) | null {
  if (!pet || pet.health <= 0) return null;
  const ability = petRegistry[pet.type]?.ability;
  return ability?.trigger === trigger ? ability.fn : null;
}

// TODO - Phase out for factory method on PetInstance + PetInstance.getData()
// A brand-new level-1 pet, as bought from the shop. `tempHealthBonus` is the
// shop item's health bonus (e.g. from Duck). Used by the buy route and the
// client's optimistic preview so the preview matches what the server places.
export function createPet(def: StaticPet, tempHealthBonus = 0): PetData {
  return {
    type: def.name,
    attack: def.baseAttack,
    health: def.baseHealth + tempHealthBonus,
    perk: def.innatePerk ?? null,
    xp: 0,
    level: 1,
  };
}

// TODO - Phase out for PetInstance
export function clonePet(p: PetData): PetData {
  return { ...p };
}