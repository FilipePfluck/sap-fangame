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

export function tryIncrementTriggerCount(
  pet: PetInstance,
  trigger: Trigger,
  limit: number
): boolean {
  const counts = pet.triggerCountsThisTurn ?? {};
  const count = counts[trigger] ?? 0;
  if (count >= limit) return false;
  pet.triggerCountsThisTurn = { ...counts, [trigger]: count + 1 };
  return true;
}
