import { StaticPet, Trigger } from "@/lib/types";
import { MelonPerk } from "@/lib/perks/melon";


export const Ox: Readonly<StaticPet> = {
  name: "Ox",
  sprite: "/sap/Ox.webp",
  tier: 3,
  baseAttack: 1,
  baseHealth: 3,
  isToken: false,
  ability: {
    trigger: Trigger.friend_ahead_faints,
    fn: (ctx) => {
      const triggers = ctx.self.triggers ?? 0;
      if (triggers >= ctx.self.level) return;
      ctx.self.triggers = triggers + 1;
      ctx.self.attack += ctx.level;
      ctx.self.perk = { ...MelonPerk };
    },
  },
  description: (level: number) =>
    `Friend ahead faints: Gain Melon perk and +1 attack. Works ${level} time per turn.`,
};