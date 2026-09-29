import { Trigger } from "@/lib/types";
import type { BattleAbilityContext, PetInstance, PetType } from "@/lib/types";

type FriendAheadTrigger = Trigger.friend_ahead_attacks | Trigger.friend_ahead_faints;

export function friendAheadAbility(
  pet: PetInstance | undefined,
  trigger: FriendAheadTrigger,
  petRegistry: Record<string, PetType>
): ((ctx: BattleAbilityContext) => void) | null {
  if (!pet || pet.health <= 0) return null;
  const ability = petRegistry[pet.type]?.ability;
  return ability?.trigger === trigger ? ability.fn : null;
}

// A brand-new level-1 pet, as bought from the shop. `tempHealthBonus` is the
// shop item's health bonus (e.g. from Duck). Used by the buy route and the
// client's optimistic preview so the preview matches what the server places.
export function createPet(def: PetType, tempHealthBonus = 0): PetInstance {
  return {
    type: def.name,
    attack: def.baseAttack,
    health: def.baseHealth + tempHealthBonus,
    perk: def.innatePerk ?? null,
    xp: 0,
    level: 1,
  };
}
