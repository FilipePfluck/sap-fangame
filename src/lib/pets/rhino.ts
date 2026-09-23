import type { PetType } from "@/lib/types";
import { dealAbilityDamage } from "@/lib/utils/combat";

export const Rhino: PetType = {
  name: "Rhino",
  sprite: "/sap/rhino.webp",
  tier: 5,
  baseAttack: 6,
  baseHealth: 7,
  isToken: false,
  ability: {
    trigger: "knock-out",
    fn: (ctx) => {
      const target = ctx.enemyTeam[0];
      if (!target) return;
      const isTier1 = ctx.petRegistry[target.type]?.tier === 1;
      dealAbilityDamage(target, (isTier1 ? 8 : 4) * ctx.level);
    },
  },
  description: (level: number) => `Knock out: Deal ${4 * level} damage to the first enemy. Double against Tier 1 Pets.`,
};
