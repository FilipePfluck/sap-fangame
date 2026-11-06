import {
  BattleAbilityContext,
  Trigger,

} from "@/lib/types";
import { BattleActions } from "@/lib/game/ability-actions";
import { DOES_NOT_DECAY, TriggerPerk } from "@/lib/game/perk";

const CHILI_DAMAGE = 5;

export const ChiliPerk: TriggerPerk = {
  name: "Chili",
  description: `Attack second enemy for ${CHILI_DAMAGE} damage.`,
  usesRemaining: DOES_NOT_DECAY,

  trigger: Trigger.after_attack,
};

export function chiliEffect(ctx: BattleAbilityContext): void {
  const target = ctx.enemyTeam[1];
  if (!target || target.health <= 0) return;
  new BattleActions(ctx).dealAbilityDamage(target, CHILI_DAMAGE);
}
