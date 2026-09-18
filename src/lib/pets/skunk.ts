import type { PetType } from "@/lib/types";

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
      const reduced = target.health - Math.ceil(target.health * 0.33);
      target.health = Math.max(1, reduced);
    },
  },
  description: "Start of battle: Reduce the highest health enemy by 33% health.",
};
