import { StaticPet, Trigger } from "@/lib/types";

export const Rooster: Readonly<StaticPet> = {
  name: "Rooster",
  sprite: "/sap/Rooster.webp",
  tier: 5,
  baseAttack: 6,
  baseHealth: 4,
  isToken: false,
  ability: {
    trigger: Trigger.faint,
    fn: (ctx) => {
      const attack = Math.floor(ctx.self.attack * 0.5);
      if (attack === 0) return;
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
    `Faint: Summon ${level === 1 ? "one" : level} ${level === 1 ? "Chick" : "Chicks"} with 1 health and 50% attack of this.`,
};