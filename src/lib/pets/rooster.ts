import { PetType, Trigger } from "@/lib/types";

export const Rooster: PetType = {
  name: "Rooster",
  sprite: "/sap/Rooster.webp",
  tier: 5,
  baseAttack: 6,
  baseHealth: 4,
  isToken: false,
  ability: {
    trigger: Trigger.faint,
    fn: (ctx) => {
      const attack = Math.round(ctx.self.attack * 0.5);
      for (let i = 0; i < ctx.level; i++) {
        ctx.summon(
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
  },
  description: (level: number) =>
    `Faint: Summon ${level === 1 ? "one" : level} ${level === 1 ? "Chick" : "Chicks"} with 1 health and 50% attack of this.\n\nChick is a token with no ability.\n\nA Rooster with 10 attack summons 5/1 chicks.`,
};