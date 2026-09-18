import type { PetType } from "@/lib/types";

export const Horse: PetType = {
  name: "Horse",
  sprite: "/sap/horse.webp",
  tier: 1,
  baseAttack: 2,
  baseHealth: 1,
  isToken: false,
  ability: {
    trigger: "friend-summoned",
    fn: (ctx) => {
      const target = ctx.team[ctx.summonedIndex!];
      if (!target) return;
      target.attack += ctx.level;
      if (ctx.inShop) target.tempAttack = (target.tempAttack ?? 0) + ctx.level;
    },
  },
  description: (level: number) =>
    `Friend summoned: Give it +${level} attack until next turn.`,
};
