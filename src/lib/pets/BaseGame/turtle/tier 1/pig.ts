import { StaticPet, Trigger } from "@/lib/types";
import { createAbilityMap } from "@/lib/pets/ability";
import { ShopActions } from "@/lib/game/ability-actions";

export const Pig: Readonly<StaticPet> = {
  name: "Pig",
  sprite: "/sap/pig.webp",
  tier: 1,
  baseAttack: 4,
  baseHealth: 1,
  isToken: false,
  abilities: createAbilityMap({
    trigger: Trigger.sell,
    fn: (ctx) => {
      new ShopActions(ctx).goldGain(ctx.level);
    },
  }),
  description: (level: number) => `Sell: Gain +${level} gold.`,
};
