import type { FoodType } from "@/lib/types";
import { fireShopFaint } from "@/lib/game/shop-ability";

export const Pill: FoodType = {
  name: "Pill",
  sprite: "/sap/pill.webp",
  tier: 2,
  isPerk: false,
  isToken: false,
  cost: 1,
  effect: {},
  applyEffect: (ctx) => fireShopFaint(ctx.board, ctx.boardPosition, ctx.petRegistry),
  description: "Make one pet faint. Always on sale!",
};
