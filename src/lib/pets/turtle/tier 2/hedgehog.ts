import { StaticPet, Trigger } from "@/lib/types";
import { livingPets } from "@/lib/utils/combat";
import { createAbilityMap } from "@/lib/pets/ability";
import { BattleActions } from "@/lib/game/ability-actions";

export const Hedgehog: Readonly<StaticPet> = {
  name: "Hedgehog",
  sprite: "/sap/Hedgehog.webp",
  tier: 2,
  baseAttack: 4,
  baseHealth: 2,
  isToken: false,
  abilities: createAbilityMap({
    trigger: Trigger.faint,
    fn: (ctx) => {
      const actions = new BattleActions(ctx);
      for (const pet of livingPets([...ctx.team, ...ctx.enemyTeam])) {
        actions.dealAbilityDamage(pet, 2 * ctx.level);
      }
    },
  }),
  description: (level: number) => `Faint: Deal ${2 * level} damage to ALL pets.`,
};