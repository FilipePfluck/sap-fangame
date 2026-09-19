import type { PetType } from "@/lib/types";

export const Squirrel: PetType = {
  name: "Squirrel",
  sprite: "/sap/Squirrel.webp",
  tier: 4,
  baseAttack: 2,
  baseHealth: 5,
  isToken: false,
  ability: {
    trigger: "start-of-turn",
    fn: (ctx) => {
      for (const food of ctx.shop.shopFoods) {
        food.discount = (food.discount ?? 0) + ctx.level;
      }
    },
  },
  description: (level: number) => `Start of turn: Discount all shop food by ${level} gold.`,
};
