import { StaticPet, Trigger } from "@/lib/types";
import { createAbilityMap } from "@/lib/pets/ability";
import { ShopActions } from "@/lib/game/ability-actions";
import { Milk } from "@/lib/foods/milk";
import { BetterMilk } from "@/lib/foods/better-milk";
import { BestMilk } from "@/lib/foods/best-milk";

const MILK_BY_LEVEL = [Milk, BetterMilk, BestMilk];
const MILKS_STOCKED = 2;

export const Cow: Readonly<StaticPet> = {
  name: "Cow",
  sprite: "/sap/Cow.webp",
  tier: 5,
  baseAttack: 4,
  baseHealth: 6,
  isToken: false,
  abilities: createAbilityMap({
    trigger: Trigger.buy,
    fn: (ctx) => {
      const milk = MILK_BY_LEVEL[ctx.level - 1];
      new ShopActions(ctx).replaceShopFood(Array(MILKS_STOCKED).fill(milk));
    },
  }),
  description: (level: number) =>
    `Buy: Replace shop food with two free ${MILK_BY_LEVEL[level - 1].name}.`,
};
