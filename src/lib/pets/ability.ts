import type {
  Ability,
  PetInstance,
  StaticPet,
  Trigger,
} from "@/lib/types";

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

// Records one more `trigger` on `pet` and returns the new count. Abilities
// that fire every Nth trigger check it with a modulus (count % N === 0);
// abilities that stop after N triggers use tryIncrementTriggerCount instead.
export function incrementTriggerCount(
  pet: PetInstance,
  trigger: Trigger
): number {
  const counts = pet.triggerCountsThisTurn ?? {};
  const count = (counts[trigger] ?? 0) + 1;
  pet.triggerCountsThisTurn = { ...counts, [trigger]: count };
  return count;
}

export function tryIncrementTriggerCount(
  pet: PetInstance,
  trigger: Trigger,
  limit: number
): boolean {
  if ((pet.triggerCountsThisTurn?.[trigger] ?? 0) >= limit) return false;
  incrementTriggerCount(pet, trigger);
  return true;
}
