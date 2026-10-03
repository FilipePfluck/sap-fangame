import {
  BasePerkType,
  DamageType,
  DefensivePerk,
  DOES_NOT_DECAY,
  OffensivePerk,
  TriggerPerk,
} from "@/lib/types";

export function isPerkUsed(type: DamageType, perk: DefensivePerk) {
  return (
    (type === DamageType.DIRECT && perk.blocksDirectDamage) ||
    (type === DamageType.ABILITY && perk.blocksAbilityDamage)
  );
}

export function decayPerk<T extends BasePerkType>(perk: T): T | null {
  const newPerk = { ...perk };
  if (newPerk.usesRemaining !== DOES_NOT_DECAY) newPerk.usesRemaining--;
  if (newPerk.usesRemaining === 0) return null;
  return newPerk;
}

export function isOffensivePerk(
  object: BasePerkType | null
): object is OffensivePerk {
  if (object === null) return false;
  try {
    return "extraDamage" in object;
  } catch {
    return false;
  }
}

export function isDefensivePerk(
  object: BasePerkType | null
): object is DefensivePerk {
  if (object === null) return false;
  try {
    return "blocksFor" in object;
  } catch {
    return false;
  }
}

export function isTriggerPerk(
  object: BasePerkType | null
): object is TriggerPerk {
  if (object === null) return false;
  try {
    return "trigger" in object;
  } catch {
    return false;
  }
}