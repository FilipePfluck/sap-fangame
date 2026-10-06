import { Trigger } from "@/lib/types";
import type { Ability, BattleAbilityContext, PetInstance, StaticPet } from "@/lib/types";

type FriendAheadTrigger = Trigger.friend_ahead_attacks | Trigger.friend_ahead_faints;

export function getPetAbility<T extends Ability["trigger"]>(
  pet: StaticPet | undefined,
  trigger: T
): Extract<Ability, { trigger: T }> | undefined {
  const abilities = [pet?.ability, ...(pet?.additionalAbilities ?? [])];
  return abilities.find((ability) => ability?.trigger === trigger) as
    | Extract<Ability, { trigger: T }>
    | undefined;
}

export function friendAheadAbility(
  pet: PetInstance | undefined,
  trigger: FriendAheadTrigger,
  petRegistry: Record<string, StaticPet>
): ((ctx: BattleAbilityContext) => void) | null {
  if (!pet || pet.health <= 0) return null;
  return getPetAbility(petRegistry[pet.type], trigger)?.fn ?? null;
}

// A brand-new level-1 pet, as bought from the shop. `tempHealthBonus` is the
// shop item's health bonus (e.g. from Duck). Used by the buy route and the
// client's optimistic preview so the preview matches what the server places.
export function createPet(def: StaticPet, tempHealthBonus = 0): PetInstance {
  return {
    type: def.name,
    attack: def.baseAttack,
    health: def.baseHealth + tempHealthBonus,
    perk: def.innatePerk ?? null,
    xp: 0,
    level: 1,
  };
}
