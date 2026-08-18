import type { PetType } from "@/lib/types";
import { pickN } from "@/lib/utils/random";

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
        target.health -= 1;
      }
    },
  },
};
