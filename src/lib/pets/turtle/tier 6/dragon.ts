import { StaticPet, Trigger } from "@/lib/types";
import {
  createAbilityMap,
  tryIncrementTriggerCount,
} from "@/lib/pets/ability";

const TRIGGER_LIMIT = 4;

export const Dragon: Readonly<StaticPet> = {
  name: "Dragon",
  sprite: "/sap/Dragon.png",
  tier: 6,
  baseAttack: 3,
  baseHealth: 8,
  isToken: false,
  abilities: createAbilityMap({
    trigger: Trigger.friend_bought,
    fn: (ctx) => {
      if (ctx.boughtPet?.tier !== 1) return;
      if (
        !tryIncrementTriggerCount(
          ctx.self,
          Trigger.friend_bought,
          TRIGGER_LIMIT
        )
      ) {
        return;
      }
      for (const friend of ctx.board) {
        if (!friend || friend === ctx.self || friend.health <= 0) continue;
        friend.attack += ctx.level;
        friend.health += ctx.level;
      }
    },
  }),
  description: (level: number) =>
    `Tier 1 friend bought: Give friends +${level} attack and +${level} health. Works 4 times per turn.`,
};
