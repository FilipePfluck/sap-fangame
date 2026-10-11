import { StaticPet, Trigger } from "@/lib/types";
import { pickN } from "@/lib/utils/random";
import { livingPets } from "@/lib/utils/combat";
import { numberToText } from "@/lib/utils/flavor-text";
import { createAbilityMap } from "@/lib/pets/ability";
import { BattleActions } from "@/lib/game/ability-actions";

export const Mosquito: Readonly<StaticPet> = {
  name: "Mosquito",
  sprite: "/sap/mosquito.webp",
  tier: 1,
  baseAttack: 2,
  baseHealth: 2,
  isToken: false,
  abilities: createAbilityMap({
    trigger: Trigger.start_of_battle,
    fn: (ctx) => {
      const actions = new BattleActions(ctx);
      for (const target of pickN(livingPets(ctx.enemyTeam), ctx.level)) {
        actions.dealAbilityDamage(target, 1);
      }
    },
  }),
  description: (level: number) => `Start of battle: Deal 1 damage to ${numberToText[level]} random enemies.`
};
