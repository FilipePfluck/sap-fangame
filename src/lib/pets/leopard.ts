import type { PetType } from "@/lib/types";
import { pickRandom } from "@/lib/utils/random";

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
      if (ctx.enemyTeam.length === 0) return;
      const target = pickRandom(ctx.enemyTeam);
      target.health -= Math.round(ctx.self.attack * 0.5);
    },
  },
  description: "Start of battle: Deal 50% attack damage to one random enemy.",
};
