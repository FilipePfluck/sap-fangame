import { StaticPet, Trigger } from "@/lib/types";

export const Rabbit: Readonly<StaticPet> = {
  name: "Rabbit",
  sprite: "/sap/Rabbit.webp",
  tier: 3,
  baseAttack: 1,
  baseHealth: 2,
  isToken: false,
  ability: {
    trigger: Trigger.friend_ate_food,
    fn: (ctx) => {
      const triggerCount = ctx.self.getAbilityActivations();
      if (triggerCount >= 3) return;
      ctx.self.incrementAbilityActivations();
      ctx.fedPet.addHealth(ctx.level);
    },
  },
  description: (level: number) =>
    `Friendly ate food: Give them +${level} health. Works 3 times per turn.`,
};