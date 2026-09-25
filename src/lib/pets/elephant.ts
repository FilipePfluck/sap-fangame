import { PetType, Trigger } from "@/lib/types";

export const Elephant: PetType = {
  name: "Elephant",
  sprite: "/sap/Elephant.png",
  tier: 3,
  baseAttack: 3,
  baseHealth: 7,
  isToken: false,
  ability: {
    trigger: Trigger.after_attack,
    fn: (ctx) => {
      for (let i = 0; i < ctx.level; i++) {
        const target = ctx.team
          .slice(ctx.selfIndex + 1)
          .find((friend) => friend.health > 0);
        if (!target) return;
        ctx.dealAbilityDamage(target, 1);
      }
    },
  },
  description: (level: number) =>
    level > 1
      ? `After attack: Deal 1 damage to the nearest friend behind. Triggers ${level} times.`
      : "After attack: Deal 1 damage to the nearest friend behind.",
};