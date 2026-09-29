import { PetType, Trigger } from "@/lib/types";

export const Sheep: PetType = {
  name: "Sheep",
  sprite: "/sap/Sheep.webp",
  tier: 3,
  baseAttack: 2,
  baseHealth: 2,
  isToken: false,
  ability: {
    trigger: Trigger.faint,
    fn: (ctx) => {
      for (let i = 0; i < 2; i++) {
        ctx.summon(
          {
            type: "Ram",
            attack: 2 * ctx.level,
            health: 2 * ctx.level,
            perk: null,
            xp: 0,
            level: 1,
          },
          ctx.selfIndex
        );
      }
    },
  },
  description: (level: number) =>
    `Faint: Summon two ${2 * level}/${2 * level} Rams.\n\nRam is a token with no ability like Bee.`,
};