import type { PetInstance, PetType } from "@/lib/types";

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
