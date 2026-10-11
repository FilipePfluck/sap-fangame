import { StaticPet, Trigger } from "@/lib/types";
import { livingPets } from "@/lib/utils/combat";
import { createAbilityMap } from "@/lib/pets/ability";
import { BattleActions } from "@/lib/game/ability-actions";

export const Crocodile: Readonly<StaticPet> = {
  name: "Crocodile",
  sprite: "/sap/crocodile.webp",
  tier: 5,
  baseAttack: 8,
  baseHealth: 4,
  isToken: false,
  abilities: createAbilityMap({
    trigger: Trigger.start_of_battle,
    fn: (ctx) => {
      const actions = new BattleActions(ctx);
      for (let i = 0; i < ctx.level; i++) {
        const alive = livingPets(ctx.enemyTeam);
        const target = alive[alive.length - 1];
        if (!target) break;
        actions.dealAbilityDamage(target, 8);
      }
    },
  }),
  description: (level: number) =>
    level > 1
      ? `Start of battle: Deal 8 damage to the last enemy. Triggers ${level} times.`
      : "Start of battle: Deal 8 damage to the last enemy.",
};
