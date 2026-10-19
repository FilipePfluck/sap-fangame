import { StaticPet, Trigger } from "@/lib/types";
import { createAbilityMap, tryIncrementTriggerCount } from "@/lib/pets/ability";

const TRIGGER_LIMIT = 1;

export const Jerboa: Readonly<StaticPet> = {
  name: "Jerboa",
  sprite: "/sap/Jerboa.png",
  tier: 4,
  baseAttack: 1,
  baseHealth: 3,
  isToken: false,
  abilities: createAbilityMap({
    trigger: Trigger.friend_ate_food,
    fn: (ctx) => {
      if (ctx.foodGroup !== "apple") return;
      if (
        !tryIncrementTriggerCount(
          ctx.self,
          Trigger.friend_ate_food,
          TRIGGER_LIMIT
        )
      ) {
        return;
      }
      for (const friend of ctx.friends) {
        if (friend === ctx.self) continue;
        friend.attack += ctx.level;
        friend.health += ctx.level;
      }
    },
  }),
  description: (level: number) =>
    `Eats Apple: Give friends +${level} attack and +${level} health. Works 1 time per turn.`,
};
