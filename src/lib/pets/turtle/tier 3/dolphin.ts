import { StaticPet, Trigger } from "@/lib/types";
import { livingPets } from "@/lib/utils/combat";
import { createAbilityMap } from "@/lib/pets/ability";
import { BattleActions } from "@/lib/game/ability-actions";

export const Dolphin: Readonly<StaticPet> = {
  name: "Dolphin",
  sprite: "/sap/dolphin.webp",
  tier: 3,
  baseAttack: 4,
  baseHealth: 3,
  isToken: false,
  abilities: createAbilityMap({
    trigger: Trigger.start_of_battle,
    fn: (ctx) => {
      const actions = new BattleActions(ctx);
      for (let i = 0; i < ctx.level; i++) {
        const alive = livingPets(ctx.enemyTeam);
        if (alive.length === 0) break;
        const target = alive.reduce((lowest, p) =>
          p.health < lowest.health ? p : lowest
        );
        actions.dealAbilityDamage(target, 4);
      }
    },
  }),
  description: (level: number) =>
    level > 1
      ? `Start of battle: Deal 4 damage to the lowest health enemy. Triggers ${level} times.`
      : "Start of battle: Deal 4 damage to the lowest health enemy.",
};
