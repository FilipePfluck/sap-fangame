import { StaticPet, Trigger } from "@/lib/types";
import { livingPets } from "@/lib/utils/combat";
import { createAbilityMap } from "@/lib/pets/ability";
import { BattleActions } from "@/lib/game/ability-actions";

export const Rhino: Readonly<StaticPet> = {
  name: "Rhino",
  sprite: "/sap/rhino.webp",
  tier: 5,
  baseAttack: 6,
  baseHealth: 7,
  isToken: false,
  abilities: createAbilityMap({
    trigger: Trigger.knock_out,
    fn: (ctx) => {
      const target = livingPets(ctx.enemyTeam)[0];
      if (!target) return;
      const isTier1 = ctx.petRegistry[target.type]?.tier === 1;
      new BattleActions(ctx).dealAbilityDamage(target, (isTier1 ? 8 : 4) * ctx.level);
    },
  }),
  description:
    (level: number) => `Knock out: Deal ${4 * level} damage to the first enemy. Double against Tier 1 Pets.`,
};
