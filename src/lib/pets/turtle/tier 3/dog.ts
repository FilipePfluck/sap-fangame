import { StaticPet, Trigger } from "@/lib/types";

export const Dog: Readonly<StaticPet> = {
  name: "Dog",
  sprite: "/sap/Dog.png",
  tier: 3,
  baseAttack: 3,
  baseHealth: 2,
  isToken: false,
  ability: {
    trigger: Trigger.friend_summoned,
    fn: (ctx) => {
      ctx.modifyStats(ctx.self, {
        attack: 2 * ctx.level,
        health: ctx.level,
      });
    },
  },
  description: (level: number) =>
    `Friend summoned: Gain +${2 * level} attack and +${level} health until next turn.`,
};