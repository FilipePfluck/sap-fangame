import { StaticPet, Trigger } from "@/lib/types";
import { createAbilityMap } from "@/lib/pets/ability";
import { BattleActions } from "@/lib/game/ability-actions";

export const Badger: Readonly<StaticPet> = {
  name: "Badger",
  sprite: "/sap/badger.webp",
  tier: 3,
  baseAttack: 6,
  baseHealth: 3,
  isToken: false,
  abilities: createAbilityMap({
    trigger: Trigger.faint,
    fn: (ctx) => {
      const actions = new BattleActions(ctx);
      const damage = Math.floor(ctx.self.attack * 0.5 * ctx.level);
      const aheadTarget = [
        ...ctx.team.slice(0, ctx.selfIndex).reverse(),
        ...ctx.enemyTeam,
      ].find((target) => target.health > 0);
      const behindTarget = ctx.team
        .slice(ctx.selfIndex + 1)
        .find((target) => target.health > 0);
      if (aheadTarget) actions.dealAbilityDamage(aheadTarget, damage);
      if (behindTarget) actions.dealAbilityDamage(behindTarget, damage);
    },
  }),
  description: (level) =>
    `Faint: Deal ${level * 50}% attack damage to adjacent pets.`,
};
