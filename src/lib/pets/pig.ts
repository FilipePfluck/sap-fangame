import type { PetType } from "@/lib/types";

export const Pig: PetType = {
  name: "Pig",
  sprite: "/sap/pig.png",
  tier: 1,
  baseAttack: 4,
  baseHealth: 1,
  isToken: false,
  ability: {
    trigger: "sell",
    fn: (ctx) => {
      ctx.goldGain(ctx.level);
    },
  },
};
