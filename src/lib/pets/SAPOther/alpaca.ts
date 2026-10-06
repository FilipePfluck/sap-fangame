import { Trigger, type StaticPet } from "@/lib/types";

export const Alpaca: StaticPet = {
  name: "Alpaca",
  sprite: "/sap/Alpaca.webp",
  tier: 6,
  baseAttack: 3,
  baseHealth: 7,
  isToken: false,
  ability: {
    trigger: Trigger.friend_summoned,
    fn: (ctx) => {
      const used = ctx.self.friendSummonsThisTurn ?? 0;
      if (used >= ctx.level || ctx.summonedIndex === undefined) return;

      const summoned = ctx.team[ctx.summonedIndex];
      if (!summoned || summoned.health <= 0) return;

      ctx.grantExperience(summoned, ctx.resolveValue({ shop: 1, battle: 3 }));
      ctx.self.friendSummonsThisTurn = used + 1;
    },
  },
  description: (level: number) =>
    `Friend summoned: Give it +1 experience. Tripled in battle. Works ${level} ${level === 1 ? "time" : "times"} per turn.`,
};