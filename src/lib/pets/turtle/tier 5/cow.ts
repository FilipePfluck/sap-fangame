import { Trigger, type StaticPet } from "@/lib/types";

const MILK_NAMES = ["Milk", "Better Milk", "Best Milk"] as const;

export const Cow: Readonly<StaticPet> = {
  name: "Cow",
  sprite: "/sap/Cow.webp",
  tier: 5,
  baseAttack: 4,
  baseHealth: 6,
  isToken: false,
  ability: {
    trigger: Trigger.buy,
    fn: (ctx) => {
      ctx.shop.shopFoods = [];
      ctx.addShopFood(MILK_NAMES[ctx.level - 1]);
      ctx.addShopFood(MILK_NAMES[ctx.level - 1]);
    },
  },
  description: (level: number) =>
    `Buy: Replace shop food with two free ${MILK_NAMES[level - 1]}.`,
};