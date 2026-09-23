import type { PetType } from "@/lib/types";

export const Crab: PetType = {
  name: "Crab",
  sprite: "/sap/crab.webp",
  tier: 2,
  baseAttack: 4,
  baseHealth: 1,
  isToken: false,
  ability: {
    trigger: "start-of-battle",
    fn: (ctx) => {
      const friendHealths = ctx.team
        .filter((_, i) => i !== ctx.selfIndex)
        .map((p) => p.health);
      if (friendHealths.length === 0) return;
      const healthiest = Math.max(...friendHealths);
      ctx.self.health += Math.round(healthiest * 0.25 * ctx.level);
    },
  },
  description: (level: number) => `Start of battle: Gain health equal to ${level * 25}% of the most healthy friend.`,
};
