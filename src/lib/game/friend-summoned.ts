import { Ability, PetInstance, StaticPet, Trigger } from "@/lib/types";
import { getPetAbility } from "@/lib/game/pet";

export type FriendSummonedAbility = Extract<
  Ability,
  { trigger: Trigger.friend_summoned }
>;

// Pets on `team` (other than the summoned one) that react to a friend being
// summoned. Shared by the battle engine and the shop.
export function friendSummonedCandidates(
  team: PetInstance[],
  summonedIndex: number,
  petRegistry: Record<string, StaticPet>
): { pet: PetInstance; ability: FriendSummonedAbility }[] {
  const candidates: { pet: PetInstance; ability: FriendSummonedAbility }[] = [];
  team.forEach((pet, i) => {
    if (i === summonedIndex || pet.health <= 0) return;
    const ability = getPetAbility(petRegistry[pet.type], Trigger.friend_summoned);
    if (ability)
      candidates.push({ pet, ability });
  });
  return candidates;
}
