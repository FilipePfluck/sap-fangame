import { PetInstance, Trigger, TriggerPerk, DOES_NOT_DECAY } from "@/lib/types";
import { dealAbilityDamage } from "@/lib/utils/combat";

const CHILI_DAMAGE = 5;

export const ChiliPerk: TriggerPerk = {
  name: "Chili",
  description: `Attack second enemy for ${CHILI_DAMAGE} damage`,
  usesRemaining: DOES_NOT_DECAY,

  trigger: Trigger.after_attack,
};

// Returns the enemy it hurt, if any, so the battle can fire its "hurt".
export function chiliEffect({
  enemyTeam,
}: {
  enemyTeam: PetInstance[];
}): PetInstance | undefined {
  const target = enemyTeam[1];
  if (!target || target.health <= 0) return undefined;

  const healthBefore = target.health;
  dealAbilityDamage(target, CHILI_DAMAGE);
  return target.health < healthBefore ? target : undefined;
}
