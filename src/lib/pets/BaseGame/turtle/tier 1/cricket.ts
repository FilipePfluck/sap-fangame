import { StaticPet, Trigger, Tag } from "@/lib/types";
import { createAbilityMap } from "@/lib/pets/ability";
import { BattleActions } from "@/lib/game/ability-actions";

export const Cricket: Readonly<StaticPet> = {
  name: "Cricket",
  id: 3,
  sprite: "/sap/cricket.webp",
  tier: 1,
  baseAttack: 1,
  baseHealth: 3,
  isToken: false,
  tags: [Tag.Summon],
  superTags: 0,
  abilities: createAbilityMap({
    trigger: Trigger.faint,
    fn: (ctx) => {
      new BattleActions(ctx).summon(
        {
          type: "Zombie Cricket",
          attack: ctx.level,
          health: ctx.level,
          perk: null,
          xp: 0,
          level: 1,
        },
        ctx.selfIndex
      );
    },
  }),
  description: (level: number) => `Faint: Summon one ${level}/${level} Zombie Cricket.`
};
