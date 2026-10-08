import {
  AbilityData,
  PetData,
  Trigger,
  type BattleAbilityContext,
  type PetInstance,
  type StaticPet,
} from "@/lib/types";
import { getAbility } from "@/lib/pets/ability";

export function serializePetData(pet: StaticPet, level: number): PetData {
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
  pet: PetInstance | undefined,
  trigger: FriendAheadTrigger,
  petRegistry: Record<string, StaticPet>
): ((ctx: BattleAbilityContext) => void) | null {
  if (!pet || pet.health <= 0) return null;
  return getAbility(petRegistry[pet.type], trigger)?.fn ?? null;
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
