import { PetInstance, PetType, Trigger } from "@/lib/types";

export const Giraffe: PetType = {
  name: "Giraffe",
  sprite: "/sap/Giraffe.webp",
  tier: 3,
  baseAttack: 1,
  baseHealth: 2,
  isToken: false,
  ability: {
    trigger: Trigger.start_of_turn,
    fn: (ctx) => {
      const friend = ctx.board
        .slice(0, ctx.selfIndex)
        .filter((pet): pet is PetInstance => pet !== null && pet.health > 0)
        .pop();
      if (!friend) return;
      friend.attack += ctx.level;
      friend.health += ctx.level;
    },
  },
  description: (level: number) =>
    `Start of turn: Give the nearest friend ahead +${level}/+${level}.`,
};