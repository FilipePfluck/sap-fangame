import type { PetType } from "@/lib/types";
import { dealAbilityDamage, isAlive } from "@/lib/utils/combat";

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
      const damage = Math.round(ctx.self.attack * 0.5);
      // "Pets" means any pet: in the front slot the pet ahead is the enemy's
      // front pet. Fainted pets can't be targeted, so that is the first
      // enemy still alive.
      const ahead =
        ctx.selfIndex === 0
          ? ctx.enemyTeam.find(isAlive)
          : ctx.team[ctx.selfIndex - 1];
      const behind = ctx.team[ctx.selfIndex + 1];
      if (ahead && isAlive(ahead)) dealAbilityDamage(ahead, damage);
      if (behind && isAlive(behind)) dealAbilityDamage(behind, damage);
    },
  },
  description: "Faint: Deal 50% attack damage to adjacent pets.",
};
