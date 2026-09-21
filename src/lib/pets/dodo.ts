import type { PetType } from "@/lib/types";
import { isAlive } from "@/lib/utils/combat";

export const Dodo: PetType = {
  name: "Dodo",
  sprite: "/sap/dodo.webp",
  tier: 3,
  baseAttack: 4,
  baseHealth: 2,
  isToken: false,
  ability: {
    trigger: "start-of-battle",
    fn: (ctx) => {
      // Nearest living friend ahead — fainted pets can't be targeted.
      let friend;
      for (let i = ctx.selfIndex - 1; i >= 0 && !friend; i--) {
        if (isAlive(ctx.team[i])) friend = ctx.team[i];
      }
      if (!friend) return;
      friend.attack += Math.round(ctx.self.attack * 0.5);
    },
  },
  description: "Start of battle: Give 50% of attack to nearest friend ahead.",
};
