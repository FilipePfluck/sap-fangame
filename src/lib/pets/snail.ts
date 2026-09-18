import type { PetType } from "@/lib/types";

export const Snail: PetType = {
  name: "Snail",
  sprite: "/sap/snail.webp",
  tier: 2,
  baseAttack: 2,
  baseHealth: 3,
  isToken: false,
  ability: {
    trigger: "end-turn",
    fn: (ctx) => {
      if (ctx.lastBattleResult !== "LOSS") return;
      let buffed = 0;
      for (let i = ctx.selfIndex - 1; i >= 0 && buffed < 3; i--) {
        const friend = ctx.board[i];
        if (friend) {
          friend.attack += 1;
          buffed++;
        }
      }
    },
  },
  description:
    "End turn: If you lost last battle, give the three nearest friends ahead +1 attack.",
};
