import { PetType, Trigger } from "@/lib/types";

export const Cricket: PetType = {
  name: "Cricket",
  sprite: "/sap/cricket.webp",
  tier: 1,
  baseAttack: 1,
  baseHealth: 3,
  isToken: false,
  ability: {
    trigger: Trigger.faint,
    fn: (ctx) => {
      ctx.summon(
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
  },
  description: (level: number) => `Faint: Summon one ${level}/${level} Zombie Cricket.`
};
