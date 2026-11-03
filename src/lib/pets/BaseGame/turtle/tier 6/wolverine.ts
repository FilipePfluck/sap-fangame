import { StaticPet, Trigger } from "@/lib/types";
import { removeHealth } from "@/lib/utils/combat";
import {
  createAbilityMap,
  getTriggerCount,
  incrementTriggerCount,
} from "@/lib/pets/ability";

const FRIENDS_HURT_PER_ACTIVATION = 4;

export const Wolverine: Readonly<StaticPet> = {
  name: "Wolverine",
  sprite: "/sap/Wolverine.webp",
  tier: 6,
  baseAttack: 5,
  baseHealth: 7,
  isToken: false,
  abilities: createAbilityMap({
    trigger: Trigger.friend_hurt,
    fn: (ctx) => {
      // Every hurt counts, including several on the same friend. Only a Tiger
      // repeat skips counting: it replays the hurt that was just counted.
      const friendsHurt = ctx.isRepeat
        ? getTriggerCount(ctx.self, Trigger.friend_hurt)
        : incrementTriggerCount(ctx.self, Trigger.friend_hurt);
      if (friendsHurt % FRIENDS_HURT_PER_ACTIVATION !== 0) return;

      for (const enemy of ctx.enemyTeam) {
        removeHealth(enemy, 3 * ctx.level);
      }
    },
  }),
  description: (level: number) =>
    `Four friends hurt: Remove ${3 * level} health from all enemies.`,
};
