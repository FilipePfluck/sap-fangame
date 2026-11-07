import { StaticPet, Trigger } from "@/lib/types";
import { createAbilityMap, tryIncrementTriggerCount } from "@/lib/pets/ability";

const TIMES_BY_LEVEL = ["two", "three", "four"];
const TRIGGER_LIMIT = 2;

export const Cat: Readonly<StaticPet> = {
  name: "Cat",
  sprite: "/sap/Cat.webp",
  tier: 6,
  baseAttack: 4,
  baseHealth: 5,
  isToken: false,
  abilities: createAbilityMap({
    trigger: Trigger.food_bought,
    fn: (ctx) => {
      const { effect } = ctx.purchase.food;
      if (!effect.attack && !effect.health) return;
      if (
        !tryIncrementTriggerCount(ctx.self, Trigger.food_bought, TRIGGER_LIMIT)
      ) {
        return;
      }
      ctx.purchase.multiplier += ctx.level;
    },
  }),
  description: (level: number) =>
    `Shop food gives ${TIMES_BY_LEVEL[level - 1]} times attack and health. Works 2 times per turn.`,
};
