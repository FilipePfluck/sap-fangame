import type { PetType } from "@/lib/types";
import { removeHealth } from "@/lib/utils/combat";

export const Skunk: PetType = {
  name: "Skunk",
  sprite: "/sap/skunk.webp",
  tier: 4,
  baseAttack: 3,
  baseHealth: 5,
  isToken: false,
  ability: {
    trigger: "start-of-battle",
    fn: (ctx) => {
      if (ctx.enemyTeam.length === 0) return;
      const target = ctx.enemyTeam.reduce((highest, p) =>
        p.health > highest.health ? p : highest
      );
      removeHealth(target, 0.33);
    },
  },
  description: "Start of battle: Reduce the highest health enemy by 33% health.",
};
