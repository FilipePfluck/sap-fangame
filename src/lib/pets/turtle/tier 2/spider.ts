import { StaticPet, Trigger } from "@/lib/types";
import { pickRandom } from "@/lib/utils/random";
import { createAbilityMap } from "@/lib/pets/ability";
import { xpForLevel } from "@/lib/game/board";
import { BattleActions } from "@/lib/game/ability-actions";

const SUMMONED_TIER = 3;

export const Spider: Readonly<StaticPet> = {
  name: "Spider",
  sprite: "/sap/Spider.webp",
  tier: 2,
  baseAttack: 2,
  baseHealth: 2,
  isToken: false,
  abilities: createAbilityMap({
    trigger: Trigger.faint,
    fn: (ctx) => {
      const pool = Object.values(ctx.petRegistry).filter(
        (pet) => pet.tier === SUMMONED_TIER && !pet.isToken
      );
      if (pool.length === 0) return;

      new BattleActions(ctx).summon(
        {
          type: pickRandom(pool).name,
          attack: 2 * ctx.level,
          health: 2 * ctx.level,
          perk: null,
          xp: xpForLevel(ctx.level),
          level: ctx.level,
        },
        ctx.selfIndex
      );
    },
  }),
  description: (level: number) =>
    `Faint: Summon one level ${level} tier ${SUMMONED_TIER} pet as a ${2 * level}/${2 * level}.`,
};
