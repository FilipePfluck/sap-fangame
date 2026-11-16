import { StaticPet, Trigger, Tag } from "@/lib/types";
import { createAbilityMap } from "@/lib/pets/ability";
import { ShopActions } from "@/lib/game/ability-actions";
import { Apple } from "@/lib/foods/BaseGame/turtle/tier 1/apple";
import { BetterApple } from "@/lib/foods/BaseGame/turtle/token/better-apple";
import { BestApple } from "@/lib/foods/BaseGame/turtle/token/best-apple";

const APPLE_BY_LEVEL = [Apple, BetterApple, BestApple];
// Apples normally cost 3 gold; Worm's are stocked at 2.
const DISCOUNT = 1;

export const Worm: Readonly<StaticPet> = {
  name: "Worm",
  id: 20,
  sprite: "/sap/Worm.png",
  tier: 2,
  baseAttack: 1,
  baseHealth: 4,
  isToken: false,
  tags: [Tag.Food],
  superTags: 0,
  abilities: createAbilityMap({
    trigger: Trigger.start_of_turn,
    fn: (ctx) => {
      new ShopActions(ctx).stockShopFood(APPLE_BY_LEVEL[ctx.level - 1], {
        discount: DISCOUNT,
      });
    },
  }),
  description: (level: number) =>
    `Start of turn: Stock one 2-gold ${APPLE_BY_LEVEL[level - 1].name}.`,
};
