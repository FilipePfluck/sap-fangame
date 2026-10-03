import {
  DOES_NOT_DECAY,
  isDefensivePerk,
  isOffensivePerk,
  PetInstance,
} from "@/lib/types";

export function livingPets(pets: readonly PetInstance[]): PetInstance[] {
  return pets.filter((pet) => pet.health > 0);
}

// The single place damage is ever applied to a pet — a normal front-line
// attack and every damage-dealing ability (Mosquito, Badger, Leopard, Rhino,
// Crocodile, Dolphin, ...) all route through this, so Garlic/Melon mitigation
// behaves identically no matter what dealt the damage. Returns the actual
// (post-mitigation) damage dealt.
//
// Peanut is NOT handled here — it only makes a normal front-line attack
// lethal, not ability damage, so battle.ts applies that check itself around
// its own two dealAbilityDamage calls.
export function dealDirectDamage(
  source: PetInstance,
  target: PetInstance
): number {
  let damage = source.attack;

  if (isOffensivePerk(source.perk)) {
    damage += source.perk.extraDamage;

    if (source.perk.usesRemaining !== DOES_NOT_DECAY) {
      source.perk.usesRemaining -= 1;
    }

    if (source.perk.usesRemaining === 0) {
      source.perk = null;
    }
  }

  if (isDefensivePerk(target.perk) && target.perk.blocksDirectDamage) {
    damage = target.perk.blocksAllDamage
      ? 0
      : Math.max(
          damage - target.perk.blocksFor,
          Math.min(damage, target.perk.minimumDamageTaken)
        );
    
    if (target.perk.usesRemaining !== DOES_NOT_DECAY) {
      target.perk.usesRemaining -= 1;
    }
    
    if (target.perk.usesRemaining === 0) {
      target.perk = null;
    }
  }

  target.health -= damage;
  return damage;
}

export function dealAbilityDamage(
  target: PetInstance,
  damage: number
): number {
  if (isDefensivePerk(target.perk) && target.perk.blocksAbilityDamage) {
    damage = target.perk.blocksAllDamage
      ? 0
      : Math.max(
          damage - target.perk.blocksFor,
          target.perk.minimumDamageTaken
        );

    if (target.perk.usesRemaining !== DOES_NOT_DECAY) {
      target.perk.usesRemaining -= 1;
    }

    if (target.perk.usesRemaining === 0) {
      target.perk = null;
    }
  }

  target.health -= damage;
  return damage;
}


export type HealthRemoval = { amount: number } | { fraction: number };

// Health removal bypasses damage mitigation and always leaves a living pet at
// 1 health or more. Percentage effects round up, while flat effects are used as-is.
export function removeHealth(target: PetInstance, removal: HealthRemoval): void {
  if (target.health <= 0) return;
  const amount = "fraction" in removal
    ? Math.ceil(target.health * removal.fraction)
    : Math.max(0, Math.floor(removal.amount));
  const reduced = target.health - amount;
  target.health = Math.max(1, reduced);
}
