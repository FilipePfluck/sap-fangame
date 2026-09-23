import type { PetType } from "@/lib/types";
import { dealAbilityDamage } from "@/lib/utils/combat";

export const Badger: PetType = {
  name: "Badger",
  sprite: "/sap/badger.webp",
  tier: 3,
  baseAttack: 6,
  baseHealth: 3,
  isToken: false,
  ability: {
    trigger: "faint",
    fn: (ctx) => {
      const damage = Math.round(ctx.self.attack * 0.5 * ctx.level);
      const ahead = ctx.team[ctx.selfIndex - 1];
      const behind = ctx.team[ctx.selfIndex + 1];
      if (ahead) dealAbilityDamage(ahead, damage);
      if (behind) dealAbilityDamage(behind, damage);
    },
  },
  description: (level) => `Faint: Deal ${level * 50}% attack damage to adjacent pets.`,
};
