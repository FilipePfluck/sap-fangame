import { StaticPet, Trigger } from "@/lib/types";

export const Pig: StaticPet = {
  name: "Pig",
  sprite: "/sap/pig.webp",
  tier: 1,
  baseAttack: 4,
  baseHealth: 1,
  isToken: false,
  ability: {
    trigger: Trigger.sell,
    fn: (ctx) => {
      ctx.goldGain(ctx.level);
    },
  },
  description: (level: number) => `Sell: Gain +${level} gold.`,
};
