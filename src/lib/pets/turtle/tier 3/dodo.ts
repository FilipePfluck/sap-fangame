import { StaticPet, Trigger } from "@/lib/types";

export const Dodo: StaticPet = {
  name: "Dodo",
  sprite: "/sap/dodo.webp",
  tier: 3,
  baseAttack: 4,
  baseHealth: 2,
  isToken: false,
  ability: {
    trigger: Trigger.start_of_battle,
    fn: (ctx) => {
      const friend = ctx.team
        .slice(0, ctx.selfIndex)
        .filter((candidate) => candidate.health > 0)
        .pop();
      if (!friend) return;
      friend.attack += Math.floor(ctx.self.attack * 0.5 * ctx.level);
    },
  },
  description: (level: number) =>
    `Start of battle: Give ${level * 50}% of attack to nearest friend ahead.`,
};
