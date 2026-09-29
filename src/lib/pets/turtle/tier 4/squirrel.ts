import { PetType, Trigger } from "@/lib/types";

export const Squirrel: PetType = {
  name: "Squirrel",
  sprite: "/sap/squirrel.webp",
  tier: 4,
  baseAttack: 2,
  baseHealth: 5,
  isToken: false,
  ability: {
    trigger: Trigger.start_of_turn,
    fn: (ctx) => {
      for (const food of ctx.shop.shopFoods) {
        food.discount = (food.discount ?? 0) + ctx.level;
      }
    },
  },
  description: (level: number) =>
    `Start of turn: Discount all shop food by ${level} gold.`,
};
