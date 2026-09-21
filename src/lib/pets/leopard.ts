import type { PetType } from "@/lib/types";
import { pickRandom } from "@/lib/utils/random";
import { dealAbilityDamage, isAlive } from "@/lib/utils/combat";

export const Leopard: PetType = {
  name: "Leopard",
  sprite: "/sap/leopard.webp",
  tier: 6,
  baseAttack: 10,
  baseHealth: 4,
  isToken: false,
  ability: {
    trigger: "start-of-battle",
    fn: (ctx) => {
      const living = ctx.enemyTeam.filter(isAlive);
      if (living.length === 0) return;
      const target = pickRandom(living);
      dealAbilityDamage(target, Math.round(ctx.self.attack * 0.5));
    },
  },
  description: "Start of battle: Deal 50% attack damage to one random enemy.",
};
