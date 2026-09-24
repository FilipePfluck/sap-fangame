import { PetType, Trigger } from "@/lib/types";
import { pickN } from "@/lib/utils/random";
import { dealAbilityDamage } from "@/lib/utils/combat";
import { numberToText } from "@/lib/utils/flavor-text";

export const Leopard: PetType = {
  name: "Leopard",
  sprite: "/sap/leopard.webp",
  tier: 6,
  baseAttack: 10,
  baseHealth: 4,
  isToken: false,
  ability: {
    trigger: Trigger.start_of_battle,
    fn: (ctx) => {
      if (ctx.enemyTeam.length === 0) return;
      for (const target of pickN(ctx.enemyTeam, ctx.level)) {
        dealAbilityDamage(target, Math.round(ctx.self.attack * 0.5));
      }
    },
  },
  description: (level: number) =>
    `Start of battle: Deal 50% attack damage to ${numberToText[level]} random enemy.`,
};
