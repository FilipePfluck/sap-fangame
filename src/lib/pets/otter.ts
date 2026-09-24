import { PetInstance, PetType, Trigger } from "@/lib/types";
import { pickRandom } from "@/lib/utils/random";

export const Otter: PetType = {
  name: "Otter",
  sprite: "/sap/otter.webp",
  tier: 1,
  baseAttack: 1,
  baseHealth: 3,
  isToken: false,
  ability: {
    trigger: Trigger.buy,
    fn: (ctx) => {
      const friends: { pet: PetInstance; idx: number }[] = [];
      for (let i = 0; i < ctx.board.length; i++) {
        const p = ctx.board[i];
        if (p !== null && i !== ctx.selfIndex) {
          friends.push({ pet: p, idx: i });
        }
      }
      if (friends.length === 0) return;
      const { pet, idx } = pickRandom(friends);
      ctx.board[idx] = { ...pet, health: pet.health + 1 };
    },
  },
  description: "Buy: Give one random friend +1 health.",
};
