import type { PetType } from "@/lib/types";
import { numberToText } from "@/lib/utils/flavor-text";

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
  description: (level: number) => `Sell: Stock ${numberToText[level]} free Bread Crumbs.`
};
