import type { PetType } from "@/lib/types";
import { pickN } from "@/lib/utils/random";
import { dealAbilityDamage } from "@/lib/utils/combat";
import { numberToText } from "@/lib/utils/flavor-text";

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
  description: (level: number) => `Start of battle: Deal 1 damage to ${numberToText[level]} random enemies.`
};
