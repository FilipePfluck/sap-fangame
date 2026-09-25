import { PetType, Trigger } from "@/lib/types";
import { pickRandom } from "@/lib/utils/random";
import { livingPets } from "@/lib/utils/combat";

export const Snake: PetType = {
  name: "Snake",
  sprite: "/sap/Snake.webp",
  tier: 6,
  baseAttack: 8,
  baseHealth: 3,
  isToken: false,
  ability: {
    trigger: Trigger.friend_ahead_attacks,
    fn: (ctx) => {
      if (ctx.triggerCount > 5) return;
      const enemy = pickRandom(livingPets(ctx.enemyTeam));
      if (enemy) ctx.dealAbilityDamage(enemy, 5 * ctx.level);
    },
  },
  description: (level: number) =>
    `Friend ahead attacks: Deal ${5 * level} damage to one random enemy. Works 5 times per turn.`,
};