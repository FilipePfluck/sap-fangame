import {
  AbilityData,
  PetTooltip,
  Trigger,
  type BattleAbilityContext,
  type PetData,
  type StaticPet, DamageType,
} from "@/lib/types";
import { getAbility } from "@/lib/pets/ability";
import { computeLevel, getMinimumXpFor } from "@/lib/game/board";
import { PET_REGISTRY } from "@/lib/pets";
import { LOG_LEVEL, LOGGING, MAX_PET_EXPERIENCE } from "@/lib/game/rules";
import {
  decayPerk,
  isDefensivePerk,
  isOffensivePerk,
  isPerkUsed,
} from "@/lib/game/perk";

let nextId = 0;

export class PetInstance {
  private readonly id: number = 0;
  private readonly data: PetData;
  private triggerStack: Map<Trigger, number> = new Map();

  static fromType(type: string): PetInstance {
    const staticPet = PET_REGISTRY[type];
    return new PetInstance({
      type,

      attack: staticPet.baseAttack,
      health: staticPet.baseHealth,
      tempAttack: 0,
      tempHealth: 0,
      maxAttack: 50,
      maxHealth: 50,

      // TODO: Move level to be purely derived from XP
      level: 1,
      xp: 0,

      perk: null,
    });
  }

  static fromMerge(a: PetInstance, b: PetInstance): PetInstance {
    const [aBaseAttack, aBaseHealth] = a.getBaseStats();
    const [bBaseAttack, bBaseHealth] = b.getBaseStats();
    const mergedAttack = Math.max(aBaseAttack, bBaseAttack) + 1;
    const mergedHealth = Math.max(aBaseHealth, bBaseHealth) + 1;

    const [aTempAttack, aTempHealth] = a.getTempStats();
    const [bTempAttack, bTempHealth] = b.getTempStats();
    const mergedTempAttack = Math.max(aTempAttack, bTempAttack);
    const mergedTempHealth = Math.max(aTempHealth, bTempHealth);

    const mergedXp = Math.min(MAX_PET_EXPERIENCE, a.getXp() + b.getXp() + 1);

    return new PetInstance({
      type: a.getType(),
      attack: mergedAttack,
      health: mergedHealth,
      perk: a.getPerk() ?? b.getPerk(),
      xp: mergedXp,
      level: computeLevel(mergedXp),
      tempAttack: mergedTempAttack,
      tempHealth: mergedTempHealth,
    });
  }

  constructor(data: PetData) {
    this.data = {
      tempAttack: 0,
      tempHealth: 0,
      maxAttack: 50,
      maxHealth: 50,
      ...data,
    };

    this.id = nextId;
    // TODO - Consider setting ID by Board since all PetInstances should be owned by a Board anyways
    // Modulus is to prevent this from incrementing infinitely, since nextId is
    // not restricted to one battle simulation
    // This ID system may introduce a race condition?
    nextId = (nextId + 1) % 9999;
    this.clampStats();
  }

  getData = () => this.data;
  getId = () => this.id;
  getType = () => this.data.type;

  getAttack = () => this.data.attack + (this.data.tempAttack ?? 0);
  getHealth = () => this.data.health + (this.data.tempHealth ?? 0);
  getStats = () => [this.getAttack(), this.getHealth()];
  getBaseStats = () => [this.data.attack, this.data.health];
  // TODO: Remove coalescing after making tempAttack / tempHealth a required field
  getTempStats = () => [this.data.tempAttack ?? 0, this.data.tempHealth ?? 0];
  getMaxStats = () => [this.data.maxAttack, this.data.maxHealth];
  getXp = () => this.data.xp;
  // TODO: Remove Lvl from PetData
  getLevel = () => this.data.level;
  getPerk = () => this.data.perk;
  // TODO: Implement sell value to update based on level-up
  getSellValue = () => this.data.sellValue ?? this.data.level;

  logTrigger(trigger: Trigger) {
    const current = this.triggerStack.get(trigger) ?? 0;
    this.triggerStack.set(trigger, current + 1);

    if (LOGGING == LOG_LEVEL.VERBOSE)
      console.log(
        `${this.getType()} (${this.getId()}) activated: ${Trigger[trigger]}`
      );
  }

  resolveTrigger(trigger: Trigger) {
    const current = this.triggerStack.get(trigger) ?? 0;
    if (current <= 0) return false;
    this.triggerStack.set(trigger, current - 1);
    return true;
  }

  addStats(value: [number, number]) {
    this.addAttack(value[0]);
    this.addHealth(value[1]);
  }

  addAttack(value: number) {
    this.data.attack += value;
    this.clampStats();
  }

  // Note: Do not implement lower bound.  Negative health caused by damage is relevant for recoil abilities.
  addHealth(value: number) {
    this.data.health += value;
    this.clampStats();
  }

  addTempAttack(value: number) {
    this.data.tempAttack = this.data.tempAttack ?? 0; // TODO: Remove after making tempAttack a required field
    this.data.tempAttack += value;
    this.clampStats();
  }

  addTempHealth(value: number) {
    this.data.tempHealth = this.data.tempHealth ?? 0; // TODO: Remove after making tempHealth a required field
    this.data.tempHealth += value;
    this.clampStats();
  }

  // Returns the amount of XP successfully added
  addXp(value: number): number {
    const toAdd = Math.min(MAX_PET_EXPERIENCE - this.data.xp, value);
    this.data.xp += toAdd;

    // Always add full stats provided by XP, even if all XP cannot be granted
    this.addStats([value, value]);
    return toAdd;
  }

  setStats(value: [number, number]): void {
    this.data.attack = value[0];
    this.data.health = value[1];
    this.clampStats();
  }

  clearTemporaryStats() {
    this.data.tempAttack = 0;
    this.data.tempHealth = 0;
  }

  clampStats() {
    this.data.maxAttack = this.data.maxAttack ?? 50; // TODO: Remove after making maxAttack a required field
    this.data.maxHealth = this.data.maxHealth ?? 50; // TODO: Remove after making maxHealth a required field
    this.data.tempAttack = this.data.tempAttack ?? 0; // TODO: Remove after making tempAttack a required field
    this.data.tempHealth = this.data.tempHealth ?? 0; // TODO: Remove after making tempHealth a required field

    this.data.attack = Math.min(this.data.attack, this.data.maxAttack);
    const overflowAttack =
      this.data.maxAttack - (this.data.attack + this.data.tempAttack);
    this.data.tempAttack = Math.min(this.data.tempAttack, overflowAttack);

    this.data.health = Math.min(this.data.health, this.data.maxHealth);
    const overflowHealth =
      this.data.maxHealth - (this.data.health + this.data.tempHealth);
    this.data.tempHealth = Math.min(this.data.tempHealth, overflowHealth);
  }

  // Returns value removed
  removeHealth(value: number) {
    const toRemove = Math.min(value, this.data.health - 1);
    this.data.health -= toRemove;
    return toRemove;
  }

  attack(targetPet: PetInstance): number[] {
    const dmgToPlayer = targetPet.takeDamage(
      this.dealDamage(),
      DamageType.DIRECT
    );
    const dmgToOpponent = this.takeDamage(
      targetPet.dealDamage(),
      DamageType.DIRECT
    );

    this.logTrigger(Trigger.after_attack);
    targetPet.logTrigger(Trigger.after_attack);
    return [dmgToPlayer, dmgToOpponent];
  }

  // Get attack damage based on offensive perk properties.
  // NOTE: This INTENTIONALLY decays offensive perks
  // TODO: Perks should likely be handled elsewhere to allow mixed affect perks (ex: Honeydew, Guava) to work as expected
  dealDamage(value = this.data.attack) {
    if (isOffensivePerk(this.data.perk)) {
      value += this.data.perk.extraDamage;

      // TODO - Decay should be handled by takeDamage to avoid removing the perk before using it
      if (this.data.perk.instantKill) return value;
      this.data.perk = decayPerk(this.data.perk);
    }

    return value;
  }

  // Applies damage based on defensive perk properties.  Returns damage taken.
  takeDamage(value: number, type: DamageType, instantKill = false): number {
    if (type === DamageType.UNDEFINED)
      throw new Error("DamageType is not specified.");

    if (isDefensivePerk(this.data.perk) && isPerkUsed(type, this.data.perk)) {
      const minimumDamage = Math.min(value, this.data.perk.minimumDamageTaken);
      value = Math.max(value - this.data.perk.blocksFor, minimumDamage);
      this.data.perk = decayPerk(this.data.perk);
    }

    if (instantKill && value > 0) {
      value = this.data.health;
    }

    if (value >= this.getHealth()) this.logTrigger(Trigger.faint);

    if (value > 0) {
      this.addHealth(-value);
      this.logTrigger(Trigger.hurt);
    } else {
      return 0;
    }

    return value;
  }

  toString(): string {
    return `${this.getType()} (${this.getAttack()}/${this.getHealth()})`;
  }
}

// The client-facing data for a pet at `level`: plain JSON values only, with
// each ability reduced to its trigger and the description resolved.
export function toPetData(pet: StaticPet, level: number): PetTooltip {
  const { abilities, description, ...data } = pet;
  return {
    ...data,
    abilities: Array.from(abilities.values(), ({ trigger }): AbilityData => ({
      trigger,
    })),
    description:
      typeof description === "function" ? description(level) : description,
  };
}

type FriendAheadTrigger =
  Trigger.friend_ahead_attacks | Trigger.friend_ahead_faints;

export function friendAheadAbility(
  pet: PetData | undefined,
  trigger: FriendAheadTrigger,
  petRegistry: Record<string, StaticPet>
): ((ctx: BattleAbilityContext) => void) | null {
  if (!pet || pet.health <= 0) return null;
  return getAbility(petRegistry[pet.type], trigger)?.fn ?? null;
}

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

// What a transform keeps from the old pet; see transformPet.
export enum TransformPreserve {
  stats,
  perk,
  level,
  experience,
}

const DEFAULT_TRANSFORM_PRESERVE: ReadonlyMap<TransformPreserve, boolean> =
  new Map([
    [TransformPreserve.stats, true],
    [TransformPreserve.perk, true],
    [TransformPreserve.level, true],
    [TransformPreserve.experience, true],
  ]);

// Turns `pet` into `into` in place (same position), keeping whatever
// `preserve` doesn't set to false, then fires the new form's "transformed"
// ability. Dropping stats gives `into`'s base stats, dropping the perk gives
// its innate perk, dropping the level resets to level 1 with no experience,
// and dropping experience removes progress beyond the current level.
export function transformPet(
  pet: PetData,
  into: StaticPet,
  friends: PetData[],
  preserve: ReadonlyMap<TransformPreserve, boolean> = new Map()
): void {
  const keeps = (part: TransformPreserve) =>
    preserve.get(part) ?? DEFAULT_TRANSFORM_PRESERVE.get(part);

  pet.type = into.name;
  if (!keeps(TransformPreserve.stats)) {
    pet.attack = into.baseAttack;
    pet.health = into.baseHealth;
    delete pet.tempAttack;
    delete pet.tempHealth;
  }
  if (!keeps(TransformPreserve.perk)) pet.perk = into.innatePerk ?? null;
  if (!keeps(TransformPreserve.level)) pet.level = 1;
  if (!keeps(TransformPreserve.level) || !keeps(TransformPreserve.experience)) {
    pet.xp = getMinimumXpFor(pet.level);
  }
  getAbility(into, Trigger.transformed)?.fn({
    self: pet,
    friends,
    level: pet.level,
  });
}
