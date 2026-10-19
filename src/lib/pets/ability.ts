import type { Ability, PetInstance, StaticPet, Trigger } from "@/lib/types";

export function createAbilityMap(
  ...abilities: Ability[]
): Map<Trigger, Ability> {
  return new Map(abilities.map((ability) => [ability.trigger, ability]));
}

function abilityMatchesTrigger<T extends Trigger>(
  ability: Ability,
  trigger: T
): ability is Extract<Ability, { trigger: T }> {
  return ability.trigger === trigger;
}

export function getAbility<T extends Trigger>(
  pet: StaticPet | undefined,
  trigger: T
): Extract<Ability, { trigger: T }> | undefined {
  const ability = pet?.abilities.get(trigger);
  if (!ability || !abilityMatchesTrigger(ability, trigger)) return undefined;
  return ability;
}

export function getTriggerCount(pet: PetInstance, trigger: Trigger): number {
  return pet.triggerCountsThisTurn?.[trigger] ?? 0;
}

// Records one more `trigger` on `pet` and returns the new count. Abilities
// that fire every Nth trigger check it with a modulus (count % N === 0).
export function incrementTriggerCount(
  pet: PetInstance,
  trigger: Trigger
): number {
  const count = getTriggerCount(pet, trigger) + 1;
  pet.triggerCountsThisTurn = {
    ...pet.triggerCountsThisTurn,
    [trigger]: count,
  };
  return count;
}

// For abilities that stop after `limit` triggers: records one more `trigger`
// and returns true, or returns false once the limit is reached.
export function tryIncrementTriggerCount(
  pet: PetInstance,
  trigger: Trigger,
  limit: number
): boolean {
  if (getTriggerCount(pet, trigger) >= limit) return false;
  incrementTriggerCount(pet, trigger);
  return true;
}
