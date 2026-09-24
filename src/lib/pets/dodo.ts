import { PetType, Trigger } from "@/lib/types";

export const Dodo: PetType = {
  name: "Dodo",
  sprite: "/sap/dodo.webp",
  tier: 3,
  baseAttack: 4,
  baseHealth: 2,
  isToken: false,
  ability: {
    trigger: Trigger.start_of_battle,
    fn: (ctx) => {
      const friend = ctx.team[ctx.selfIndex - 1];
      if (!friend) return;
      friend.attack += Math.round(ctx.self.attack * 0.5);
    },
  },
  description: "Start of battle: Give 50% of attack to nearest friend ahead.",
};
