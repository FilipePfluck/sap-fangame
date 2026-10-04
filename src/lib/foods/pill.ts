import { FoodType } from "@/lib/types";
import { fireShopFaint } from "@/lib/game/shop-ability";
import { Board } from "@/lib/game/board";

export const Pill: FoodType = {
  name: "Pill",
  sprite: "/sap/pill.webp",
  tier: 2,
  isToken: false,
  cost: 1,
  effect: {},
  skipsFriendAteFood: true,
  applyEffect: (ctx) => fireShopFaint(ctx.board, ctx.boardPosition, ctx.petRegistry),
  description: "Make one pet faint. Always on sale!",
};
