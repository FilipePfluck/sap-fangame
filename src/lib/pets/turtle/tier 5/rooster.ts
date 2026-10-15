import { StaticPet, Trigger } from "@/lib/types";
import { numberToText } from "@/lib/utils/flavor-text";
import { createAbilityMap } from "@/lib/pets/ability";
import { BattleActions } from "@/lib/game/ability-actions";

export const Rooster: Readonly<StaticPet> = {
  name: "Rooster",
  sprite: "/sap/Rooster.webp",
  tier: 5,
  baseAttack: 6,
  baseHealth: 4,
  isToken: false,
  abilities: createAbilityMap({
    trigger: Trigger.faint,
    fn: (ctx) => {
      const actions = new BattleActions(ctx);
      const attack = Math.floor(ctx.self.attack * 0.5);
      if (attack === 0) return;
      for (let i = 0; i < ctx.level; i++) {
        actions.summon(
          {
            type: "Chick",
            attack,
            health: 1,
            perk: null,
            xp: 0,
            level: 1,
          },
          ctx.selfIndex
        );
      }
    },
  }),
  description: (level: number) =>
    `Faint: Summon ${numberToText[level]} ${level === 1 ? "Chick" : "Chicks"} with 1 health and 50% attack of this.`,
};