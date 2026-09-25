import { PetType, Trigger } from "@/lib/types";
import { livingPets } from "@/lib/utils/combat";

export const Dolphin: PetType = {
  name: "Dolphin",
  sprite: "/sap/dolphin.webp",
  tier: 3,
  baseAttack: 4,
  baseHealth: 3,
  isToken: false,
  ability: {
    trigger: Trigger.start_of_battle,
    fn: (ctx) => {
      for (let i = 0; i < ctx.level; i++) {
        const alive = livingPets(ctx.enemyTeam);
        if (alive.length === 0) break;
        const target = alive.reduce((lowest, p) =>
          p.health < lowest.health ? p : lowest
        );
        ctx.dealAbilityDamage(target, 4);
      }
    },
  },
  description: (level: number) =>
    level > 1
      ? `Start of battle: Deal 4 damage to the lowest health enemy. Triggers ${level} times.`
      : "Start of battle: Deal 4 damage to the lowest health enemy.",
};
