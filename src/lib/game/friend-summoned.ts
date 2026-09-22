import { Ability, PetInstance, PetType, Trigger } from "@/lib/types";

export type FriendSummonedAbility = Extract<
  Ability,
  { trigger: Trigger.friend_summoned }
>;

// Pets on `team` (other than the summoned one) that react to a friend being
// summoned. Shared by the battle engine and the shop.
export function friendSummonedCandidates(
  team: PetInstance[],
  summonedIndex: number,
  petRegistry: Record<string, PetType>
): { pet: PetInstance; ability: FriendSummonedAbility }[] {
  const candidates: { pet: PetInstance; ability: FriendSummonedAbility }[] = [];
  team.forEach((pet, i) => {
    if (i === summonedIndex) return;
    const ability = petRegistry[pet.type]?.ability;
    if (ability?.trigger === Trigger.friend_summoned)
      candidates.push({ pet, ability });
  });
  return candidates;
}
