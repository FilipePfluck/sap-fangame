import type { PetType } from "@/lib/types";

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
      target.health -= isTier1 ? 8 : 4;
    },
  },
  description: "Knock out: Deal 4 damage to the first enemy. Double against Tier 1 Pets.",
};
