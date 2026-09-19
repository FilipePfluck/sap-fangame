import type { PetType } from "@/lib/types";
import { pickN } from "@/lib/utils/random";
import { dealAbilityDamage } from "@/lib/utils/combat";

export const Mosquito: PetType = {
  name: "Mosquito",
  sprite: "/sap/mosquito.webp",
  tier: 1,
  baseAttack: 2,
  baseHealth: 2,
  isToken: false,
  ability: {
    trigger: "start-of-battle",
    fn: (ctx) => {
      for (const target of pickN(ctx.enemyTeam, ctx.level)) {
        dealAbilityDamage(target, 1);
      }
    },
  },
  description: (level: number) =>
    level > 1
      ? `Start of battle: Deal 1 damage to ${level} random enemies.`
      : "Start of battle: Deal 1 damage to one random enemy.",
};
