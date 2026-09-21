import type { PetInstance } from "@/lib/types";

// Pets that have fainted stay in a team until their faint resolves, but they
// are never valid targets for an ability.
export function isAlive(pet: PetInstance): boolean {
  return pet.health > 0;
}

// The single place damage is ever applied to a pet — a normal front-line
// attack and every damage-dealing ability (Mosquito, Badger, Leopard, Rhino,
// Crocodile, Dolphin, ...) all route through this, so Garlic/Melon mitigation
// behaves identically no matter what dealt the damage. Returns the actual
// (post-mitigation) damage dealt.
//
// Peanut is NOT handled here — it only makes a normal front-line attack
// lethal, not ability damage, so battle.ts applies that check itself around
// its own two dealAbilityDamage calls.
export function dealAbilityDamage(target: PetInstance, amount: number): number {
  let damage = amount;
  if (target.perk === "Garlic") {
    damage = Math.max(2, damage - 2);
  }
  if (target.perk === "Melon") {
    const blocked = Math.min(20, damage);
    damage -= blocked;
    target.perk = null;
  }
  target.health -= damage;
  return damage;
}

// Skunk-style effects remove a flat percentage of a pet's *current* health
// directly, rather than dealing damage — so unlike dealAbilityDamage, this
// never checks Garlic/Melon/Peanut. It always leaves at least 1 health.
export function removeHealth(target: PetInstance, fraction: number): void {
  const reduced = target.health - Math.ceil(target.health * fraction);
  target.health = Math.max(1, reduced);
}
