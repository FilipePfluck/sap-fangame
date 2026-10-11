import { StaticPet, Trigger } from "@/lib/types";
import { pickRandom } from "@/lib/utils/random";
import { livingPets } from "@/lib/utils/combat";
import {
  createAbilityMap,
  tryIncrementTriggerCount,
} from "@/lib/pets/ability";
import { BattleActions } from "@/lib/game/ability-actions";

const TRIGGER_LIMIT = 5;

export const Snake: Readonly<StaticPet> = {
  name: "Snake",
  sprite: "/sap/Snake.webp",
  tier: 6,
  baseAttack: 8,
  baseHealth: 3,
  isToken: false,
  abilities: createAbilityMap({
    trigger: Trigger.friend_ahead_attacks,
    fn: (ctx) => {
      if (
        !tryIncrementTriggerCount(
          ctx.self,
          Trigger.friend_ahead_attacks,
          TRIGGER_LIMIT
        )
      ) {
        return;
      }
      const enemy = pickRandom(livingPets(ctx.enemyTeam));
      if (enemy) new BattleActions(ctx).dealAbilityDamage(enemy, 5 * ctx.level);
    },
  }),
  description: (level: number) =>
    `Friend ahead attacks: Deal ${5 * level} damage to one random enemy. Works 5 times per battle.`,
};