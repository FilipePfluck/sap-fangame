import type { PetType } from "@/lib/types";

export const Swan: PetType = {
  name: "Swan",
  sprite: "/sap/swan.webp",
  tier: 2,
  baseAttack: 1,
  baseHealth: 2,
  isToken: false,
  ability: {
    trigger: "start-of-turn",
    fn: (ctx) => {
      ctx.goldGain(ctx.level);
    },
  },
  description: (level: number) => `Start of turn: Gain +${level} gold.`,
};
