import { PetType, Trigger } from "@/lib/types";

export const Badger: PetType = {
  name: "Badger",
  sprite: "/sap/badger.webp",
  tier: 3,
  baseAttack: 6,
  baseHealth: 3,
  isToken: false,
  ability: {
    trigger: Trigger.faint,
    fn: (ctx) => {
      const damage = Math.round(ctx.self.attack * 0.5 * ctx.level);
      const aheadTarget = [
        ...ctx.team.slice(0, ctx.selfIndex).reverse(),
        ...ctx.enemyTeam,
      ].find((target) => target.health > 0);
      const behindTarget = ctx.team
        .slice(ctx.selfIndex + 1)
        .find((target) => target.health > 0);
      if (aheadTarget) ctx.dealAbilityDamage(aheadTarget, damage);
      if (behindTarget) ctx.dealAbilityDamage(behindTarget, damage);
    },
  },
  description: (level) =>
    `Faint: Deal ${level * 50}% attack damage to the nearest living pets ahead and behind.`,
};
