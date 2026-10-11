import { StaticPet, Trigger } from "@/lib/types";
import {
  createAbilityMap,
  tryIncrementTriggerCount,
} from "@/lib/pets/ability";

const TRIGGER_LIMIT = 3;

export const Rabbit: Readonly<StaticPet> = {
  name: "Rabbit",
  sprite: "/sap/Rabbit.webp",
  tier: 3,
  baseAttack: 1,
  baseHealth: 2,
  isToken: false,
  abilities: createAbilityMap({
    trigger: Trigger.friend_ate_food,
    fn: (ctx) => {
      if (
        !tryIncrementTriggerCount(
          ctx.self,
          Trigger.friend_ate_food,
          TRIGGER_LIMIT
        )
      ) {
        return;
      }
      ctx.fedPet.health += ctx.level;
    },
  }),
  description: (level: number) =>
    `Friendly ate food: Give them +${level} health. Works 3 times per turn.`,
};
