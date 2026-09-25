import { PetType, Trigger } from "@/lib/types";
import { pickN } from "@/lib/utils/random";
import { livingPets } from "@/lib/utils/combat";
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
      const enemies = livingPets(ctx.enemyTeam);
      if (enemies.length === 0) return;
      for (const target of pickN(enemies, ctx.level)) {
        ctx.dealAbilityDamage(target, Math.round(ctx.self.attack * 0.5));
      }
    },
  },
  description: (level: number) =>
    `Start of battle: Deal 50% attack damage to ${numberToText[level]} random enemy.`,
};
