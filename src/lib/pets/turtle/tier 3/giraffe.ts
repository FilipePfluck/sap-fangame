import { PetData, StaticPet, Trigger } from "@/lib/types";

export const Giraffe: StaticPet = {
  name: "Giraffe",
  sprite: "/sap/Giraffe.webp",
  tier: 3,
  baseAttack: 1,
  baseHealth: 2,
  isToken: false,
  ability: {
    trigger: Trigger.start_of_turn,
    fn: (ctx) => {
      const friendsAhead = ctx.board
        .slice(0, ctx.selfIndex)
        .filter((pet): pet is PetData => pet !== null && pet.health > 0);
      for (let i = 0; i < ctx.self.level; i++) {
        const friend = friendsAhead.pop();
        if (!friend) return;
        friend.attack++
        friend.health++
      }
    },
  },
  description: (level: number) =>
    `Start of turn: Give the nearest ${level} ${level > 1 ? "friends" : "friend"} ahead +1 attack and +1 health.`,
};