import { StaticPet, Trigger } from "@/lib/types";

export const Monkey: Readonly<StaticPet> = {
  name: "Monkey",
  sprite: "/sap/Monkey.webp",
  tier: 5,
  baseAttack: 1,
  baseHealth: 2,
  isToken: false,
  ability: {
    trigger: Trigger.end_turn,
    fn: (ctx) => {
      const frontFriend =
        ctx.board.find((pet) => pet !== null && pet.health > 0) ?? ctx.self;
      frontFriend.attack += 2 * ctx.level;
      frontFriend.health += 2 * ctx.level;
    },
  },
  description: (level: number) =>
    `End turn: Give front-most friendly pet +${2 * level} attack and +${2 * level} health.`,
};