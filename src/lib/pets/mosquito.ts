import { PetType, Trigger } from "@/lib/types";
import { pickN } from "@/lib/utils/random";
import { livingPets } from "@/lib/utils/combat";
import { numberToText } from "@/lib/utils/flavor-text";

export const Mosquito: PetType = {
  name: "Mosquito",
  sprite: "/sap/mosquito.webp",
  tier: 1,
  baseAttack: 2,
  baseHealth: 2,
  isToken: false,
  ability: {
    trigger: Trigger.start_of_battle,
    fn: (ctx) => {
      for (const target of pickN(livingPets(ctx.enemyTeam), ctx.level)) {
        ctx.dealAbilityDamage(target, 1);
      }
    },
  },
  description: (level: number) => `Start of battle: Deal 1 damage to ${numberToText[level]} random enemies.`
};
