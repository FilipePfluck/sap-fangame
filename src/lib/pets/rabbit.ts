import { PetType, Trigger } from "@/lib/types";

export const Rabbit: PetType = {
  name: "Rabbit",
  sprite: "/sap/Rabbit.webp",
  tier: 3,
  baseAttack: 1,
  baseHealth: 2,
  isToken: false,
  ability: {
    trigger: Trigger.friend_ate_food,
    fn: (ctx) => {
      const triggerCount = ctx.self.foodTriggersThisTurn ?? 0;
      if (triggerCount >= 3) return;
      ctx.self.foodTriggersThisTurn = triggerCount + 1;
      ctx.fedPet.health += ctx.level;
    },
  },
  description: (level: number) =>
    `Friend ate food: Give them +${level} health. Works 3 times per turn.`,
};