import { Ability, PetData, StaticPet, Trigger } from "@/lib/types";
import { getAbility } from "@/lib/pets/ability";

export type FriendSummonedAbility = Extract<
  Ability,
  { trigger: Trigger.friend_summoned }
>;

// Pets on `team` (other than the summoned one) that react to a friend being
// summoned. Shared by the battle engine and the shop.
export function friendSummonedCandidates(
  team: PetData[],
  summonedIndex: number,
  petRegistry: Record<string, StaticPet>
): { pet: PetData; ability: FriendSummonedAbility }[] {
  const candidates: { pet: PetData; ability: FriendSummonedAbility }[] = [];
  team.forEach((pet, i) => {
    if (i === summonedIndex || pet.health <= 0) return;
    const ability = getAbility(petRegistry[pet.type], Trigger.friend_summoned);
    if (ability) candidates.push({ pet, ability });
  });
  return candidates;
}
