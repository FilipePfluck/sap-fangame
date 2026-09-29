import { PetType, Trigger } from "@/lib/types";
import { pickN } from "@/lib/utils/random";

export const Seal: PetType = {
  name: "Seal",
  sprite: "/sap/Seal.webp",
  tier: 5,
  baseAttack: 3,
  baseHealth: 8,
  isToken: false,
  ability: {
    trigger: Trigger.friend_ate_food,
    fn: (ctx) => {
      if (ctx.self !== ctx.fedPet) return;
      const friends = ctx.friends.filter(
        (pet) => pet !== ctx.self && pet.health > 0
      );
      for (const friend of pickN(friends, 3)) {
        friend.attack += ctx.level;
      }
    },
  },
  description: (level: number) =>
    `Eats food: Give three random friends +${level} attack.\n\nThis triggers only when this eats food.`,
};