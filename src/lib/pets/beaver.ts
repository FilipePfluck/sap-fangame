import { PetInstance, PetType, Trigger } from "@/lib/types";
import { pickN } from "@/lib/utils/random";

export const Beaver: PetType = {
  name: "Beaver",
  sprite: "/sap/beaver.webp",
  tier: 1,
  baseAttack: 3,
  baseHealth: 2,
  isToken: false,
  ability: {
    trigger: Trigger.sell,
    fn: (ctx) => {
      const friends: { pet: PetInstance; idx: number }[] = [];
      for (let i = 0; i < ctx.board.length; i++) {
        const p = ctx.board[i];
        if (p !== null && i !== ctx.selfIndex) {
          friends.push({ pet: p, idx: i });
        }
      }
      for (const { pet, idx } of pickN(friends, 2)) {
        ctx.board[idx] = { ...pet, attack: pet.attack + 1 };
      }
    },
  },
  description: "Sell: Give two random friends +1 attack.",
};
