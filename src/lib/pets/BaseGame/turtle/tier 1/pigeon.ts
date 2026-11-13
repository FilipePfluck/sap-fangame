import { StaticPet, Trigger, Tag } from "@/lib/types";
import { numberToText } from "@/lib/utils/flavor-text";
import { createAbilityMap } from "@/lib/pets/ability";
import { ShopActions } from "@/lib/game/ability-actions";
import { BreadCrumbs } from "@/lib/foods/BaseGame/turtle/token/bread-crumbs";

export const Pigeon: Readonly<StaticPet> = {
  name: "Pigeon",
  sprite: "/sap/pigeon.webp",
  tier: 1,
  baseAttack: 3,
  baseHealth: 2,
  isToken: false,
  tags: [Tag.Food],
  superTags: 0,
  abilities: createAbilityMap({
    trigger: Trigger.sell,
    fn: (ctx) => {
      const actions = new ShopActions(ctx);
      for (let i = 0; i < ctx.level; i++) {
        actions.stockShopFood(BreadCrumbs);
      }
    },
  }),
  description: (level: number) => `Sell: Stock ${numberToText[level]} free Bread Crumbs.`
};
