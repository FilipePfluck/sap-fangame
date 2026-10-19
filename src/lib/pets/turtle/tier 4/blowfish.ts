import { StaticPet, Trigger } from "@/lib/types";
import { livingPets } from "@/lib/utils/combat";
import { pickRandom } from "@/lib/utils/random";
import { createAbilityMap } from "@/lib/pets/ability";
import { BattleActions } from "@/lib/game/ability-actions";

export const Blowfish: Readonly<StaticPet> = {
  name: "Blowfish",
  sprite: "/sap/Blowfish.png",
  tier: 4,
  baseAttack: 3,
  baseHealth: 6,
  isToken: false,
  abilities: createAbilityMap({
    trigger: Trigger.hurt,
    fn: (ctx) => {
      const enemy = pickRandom(livingPets(ctx.enemyTeam));
      if (enemy) new BattleActions(ctx).dealAbilityDamage(enemy, 3 * ctx.level);
    },
  }),
  description: (level: number) =>
    `Hurt: Deal ${3 * level} damage to one random enemy.`,
};