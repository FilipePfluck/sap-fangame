import { Trigger, type StaticPet } from "@/lib/types";

export const Rat: StaticPet = {
  name: "Rat",
  sprite: "/sap/Rat.png",
  tier: 2,
  baseAttack: 3,
  baseHealth: 6,
  isToken: false,
  ability: {
    trigger: Trigger.faint,
    fn: (ctx) => {
      for (let i = 0; i < ctx.level; i++) {
        ctx.summon(
          {
            type: "Dirty Rat",
            attack: 1,
            health: 1,
            perk: null,
            xp: 0,
            level: 1,
          },
          0,
          { side: "enemy", triggerFriendSummoned: false }
        );
      }
    },
  },
  description: (level: number) =>
    `Faint: Summon ${level === 1 ? "one" : level === 2 ? "two" : "three"} 1/1 Dirty Rat${level === 1 ? "" : "s"} up front for the opponent. Doesn't trigger any summon abilities.`,
};