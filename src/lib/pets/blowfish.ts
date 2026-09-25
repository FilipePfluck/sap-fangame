import { PetType, Trigger } from "@/lib/types";
import { livingPets } from "@/lib/utils/combat";
import { pickRandom } from "@/lib/utils/random";

export const Blowfish: PetType = {
  name: "Blowfish",
  sprite: "/sap/Blowfish.png",
  tier: 4,
  baseAttack: 3,
  baseHealth: 6,
  isToken: false,
  ability: {
    trigger: Trigger.hurt,
    fn: (ctx) => {
      const enemy = pickRandom(livingPets(ctx.enemyTeam));
      if (enemy) ctx.dealAbilityDamage(enemy, 3 * ctx.level);
    },
  },
  description: (level: number) =>
    `Hurt: Deal ${3 * level} damage to one random enemy.`,
};