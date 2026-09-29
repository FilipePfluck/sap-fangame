import { PetType, Trigger } from "@/lib/types";

export const Camel: PetType = {
  name: "Camel",
  sprite: "/sap/Camel.webp",
  tier: 3,
  baseAttack: 3,
  baseHealth: 3,
  isToken: false,
  ability: {
    trigger: Trigger.hurt,
    fn: (ctx) => {
      const friend = ctx.team
        .slice(ctx.selfIndex + 1)
        .find((pet) => pet.health > 0);
      if (!friend) return;
      friend.attack += ctx.level;
      friend.health += 2 * ctx.level;
    },
  },
  description: (level: number) =>
    `Hurt: Give the nearest friend behind +${level} attack and +${2 * level} health.`,
};