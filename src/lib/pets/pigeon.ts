import type { PetType } from "@/lib/types";

export const Pigeon: PetType = {
  name: "Pigeon",
  sprite: "/sap/pigeon.webp",
  tier: 1,
  baseAttack: 3,
  baseHealth: 2,
  isToken: false,
  ability: {
    trigger: "sell",
    fn: (ctx) => {
      for (let i = 0; i < ctx.level; i++) {
        ctx.addShopFood("Bread Crumbs");
      }
    },
  },
  description: (level: number) =>
    level > 1
      ? `Sell: Stock ${level} free Bread Crumbs.`
      : "Sell: Stock one free Bread Crumbs.",
};
