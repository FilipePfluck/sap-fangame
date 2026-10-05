import { Trigger, type StaticPet } from "@/lib/types";

export const Fly: Readonly<StaticPet> = {
  name: "Fly",
  sprite: "/sap/Fly.png",
  tier: 6,
  baseAttack: 4,
  baseHealth: 4,
  isToken: false,
  ability: {
    trigger: Trigger.friend_faints,
    fn: (ctx) => {
      if (ctx.triggerCount > 3) return;
      ctx.summon(
        {
          type: "Zombie Fly",
          attack: 4 * ctx.level,
          health: 4 * ctx.level,
          perk: null,
          xp: 0,
          level: 1,
        },
        ctx.faintedIndex ?? ctx.selfIndex,
        { waitForSpace: true }
      );
    },
  },
  description: (level: number) =>
    `Friend faints: Summon one ${4 * level}/${4 * level} Zombie Fly in its place. Works 3 times per turn.`,
};