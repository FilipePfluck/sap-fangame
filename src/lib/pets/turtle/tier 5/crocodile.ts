import { PetType, Trigger } from "@/lib/types";
import { livingPets } from "@/lib/utils/combat";

export const Crocodile: PetType = {
  name: "Crocodile",
  sprite: "/sap/crocodile.webp",
  tier: 5,
  baseAttack: 8,
  baseHealth: 4,
  isToken: false,
  ability: {
    trigger: Trigger.start_of_battle,
    fn: (ctx) => {
      for (let i = 0; i < ctx.level; i++) {
        const alive = livingPets(ctx.enemyTeam);
        const target = alive[alive.length - 1];
        if (!target) break;
        ctx.dealAbilityDamage(target, 8);
      }
    },
  },
  description: (level: number) =>
    level > 1
      ? `Start of battle: Deal 8 damage to the last enemy. Triggers ${level} times.`
      : "Start of battle: Deal 8 damage to the last enemy.",
};
