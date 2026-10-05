import { Trigger, type StaticPet } from "@/lib/types";

export const Seagull: Readonly<StaticPet> = {
  name: "Seagull",
  sprite: "/sap/Seagull.webp",
  tier: 4,
  baseAttack: 4,
  baseHealth: 3,
  isToken: false,
  ability: {
    trigger: Trigger.friend_summoned,
    fn: (ctx) => {
      const summoned = ctx.summonedIndex === undefined
        ? undefined
        : ctx.team[ctx.summonedIndex];
      const perk = ctx.self.perk;
      if (!summoned || !perk || summoned.perk?.name === perk.name) return;

      const copies = ctx.self.friendSummonsThisTurn ?? 0;
      if (copies >= ctx.level) return;

      summoned.perk = { ...perk };
      ctx.self.friendSummonsThisTurn = copies + 1;
    },
  },
  description: (level: number) =>
    `Friend summoned: Copy this pet's food perk to it. Works ${level} ${level === 1 ? "time" : "times"} per turn.`,
};