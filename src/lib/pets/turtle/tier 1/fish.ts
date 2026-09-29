import { PetInstance, PetType, Trigger } from "@/lib/types";
import { pickN } from "@/lib/utils/random";

export const Fish: PetType = {
  name: "Fish",
  sprite: "/sap/fish.webp",
  tier: 1,
  baseAttack: 3,
  baseHealth: 2,
  isToken: false,
  ability: {
    trigger: Trigger.level_up,
    // ctx.level is the OLD level (before level-up) — see fireShopAbility call sites.
    // lvl1 fish levels up → ctx.level=1 → +1/+1 to 2 friends
    // lvl2 fish levels up → ctx.level=2 → +2/+2 to 2 friends
    fn: (ctx) => {
      const friends: { pet: PetInstance; idx: number }[] = [];
      for (let i = 0; i < ctx.board.length; i++) {
        const p = ctx.board[i];
        if (p !== null && i !== ctx.selfIndex) {
          friends.push({ pet: p, idx: i });
        }
      }
      for (const { pet, idx } of pickN(friends, 2)) {
        ctx.board[idx] = {
          ...pet,
          attack: pet.attack + ctx.level,
          health: pet.health + ctx.level,
        };
      }
    },
  },
  description: (level: number) =>
    level >= 3
      ? "No ability."
      : `Level up: Give two friends +${level} attack and +${level} health.`,
};
