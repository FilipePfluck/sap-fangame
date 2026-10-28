import {
  DOES_NOT_DECAY,
  PetData,
} from "@/lib/types";
import { isDefensivePerk } from "@/lib/game/perk";

export function livingPets(pets: readonly PetData[]): PetData[] {
  return pets.filter((pet) => pet.health > 0);
}

export function dealAbilityDamage(
  target: PetData,
  damage: number
): number {
  if (isDefensivePerk(target.perk) && target.perk.blocksAbilityDamage) {
    damage = Math.max(
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


// Skunk-style effects remove a flat percentage of a pet's *current* health
// directly, rather than dealing damage — so unlike dealAbilityDamage, this
// never checks Garlic/Melon/Peanut. It always leaves at least 1 health.
export function removeHealth(target: PetData, fraction: number): void {
  const reduced = target.health - Math.ceil(target.health * fraction);
  target.health = Math.max(1, reduced);
}
