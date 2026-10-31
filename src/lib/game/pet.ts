import {
  AbilityData,
  PetData,
  Trigger,
  type BattleAbilityContext,
  type PetInstance,
  type StaticPet,
} from "@/lib/types";
import { getAbility } from "@/lib/pets/ability";
import { getMinimumXpFor } from "@/lib/game/board";

// The client-facing data for a pet at `level`: plain JSON values only, with
// each ability reduced to its trigger and the description resolved.
export function toPetData(pet: StaticPet, level: number): PetData {
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

// What a transform keeps from the old pet; see transformPet.
export enum TransformPreserve {
  stats,
  perk,
  level,
  experience,
}

const DEFAULT_TRANSFORM_PRESERVE: ReadonlyMap<TransformPreserve, boolean> =
  new Map([
    [TransformPreserve.stats, true],
    [TransformPreserve.perk, true],
    [TransformPreserve.level, true],
    [TransformPreserve.experience, true],
  ]);

// Turns `pet` into `into` in place (same position), keeping whatever
// `preserve` doesn't set to false, then fires the new form's "transformed"
// ability. Dropping stats gives `into`'s base stats, dropping the perk gives
// its innate perk, dropping the level resets to level 1 with no experience,
// and dropping experience removes progress beyond the current level.
export function transformPet(
  pet: PetInstance,
  into: StaticPet,
  friends: PetInstance[],
  preserve: ReadonlyMap<TransformPreserve, boolean> = new Map()
): void {
  const keeps = (part: TransformPreserve) =>
    preserve.get(part) ?? DEFAULT_TRANSFORM_PRESERVE.get(part);

  pet.type = into.name;
  if (!keeps(TransformPreserve.stats)) {
    pet.attack = into.baseAttack;
    pet.health = into.baseHealth;
    delete pet.tempAttack;
    delete pet.tempHealth;
  }
  if (!keeps(TransformPreserve.perk)) pet.perk = into.innatePerk ?? null;
  if (!keeps(TransformPreserve.level)) pet.level = 1;
  if (!keeps(TransformPreserve.level) || !keeps(TransformPreserve.experience)) {
    pet.xp = getMinimumXpFor(pet.level);
  }
  getAbility(into, Trigger.transformed)?.fn({
    self: pet,
    friends,
    level: pet.level,
  });
}
