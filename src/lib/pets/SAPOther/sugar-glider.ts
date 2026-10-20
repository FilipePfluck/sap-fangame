import { StaticPet, Trigger } from "@/lib/types";
import { createAbilityMap } from "@/lib/pets/ability";
import { ShopActions } from "@/lib/game/ability-actions";
import { PET_COST } from "@/lib/game/costs";
import { Cupcake } from "@/lib/foods/cupcake";

const EFFECT_BY_LEVEL = ["", " with double effect", " with triple effect"];

export const SugarGlider: Readonly<StaticPet> = {
  name: "Sugar Glider",
  sprite: "/sap/Sugar_Glider.png",
  tier: 3,
  baseAttack: 1,
  baseHealth: 3,
  isToken: false,
  abilities: createAbilityMap({
    trigger: Trigger.start_of_turn,
    fn: (ctx) => {
      new ShopActions(ctx).stockShopFood(Cupcake, {
        discount: Cupcake.cost ?? PET_COST,
        multiplier: ctx.level,
      });
    },
  }),
  description: (level: number) =>
    `Start of turn: Stock one free Cupcake${EFFECT_BY_LEVEL[level - 1]}.`,
};
