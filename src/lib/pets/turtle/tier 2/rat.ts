import { StaticPet, Trigger } from "@/lib/types";
import { numberToText } from "@/lib/utils/flavor-text";
import { createAbilityMap } from "@/lib/pets/ability";
import { createPet } from "@/lib/game/pet";
import { BattleActions } from "@/lib/game/ability-actions";
import { DirtyRat } from "@/lib/pets/turtle/token/dirty-rat";

export const Rat: Readonly<StaticPet> = {
  name: "Rat",
  sprite: "/sap/Rat.png",
  tier: 2,
  baseAttack: 3,
  baseHealth: 6,
  isToken: false,
  abilities: createAbilityMap({
    trigger: Trigger.faint,
    fn: (ctx) => {
      const actions = new BattleActions(ctx);
      for (let i = 0; i < ctx.level; i++) {
        actions.summon(createPet(DirtyRat), 0, {
          onEnemyTeam: true,
          skipsFriendSummoned: true,
        });
      }
    },
  }),
  description: (level: number) =>
    `Faint: Summon ${numberToText[level]} 1/1 Dirty Rat${level === 1 ? "" : "s"} up front for the opponent. Doesn't trigger any summon abilities.`,
};
