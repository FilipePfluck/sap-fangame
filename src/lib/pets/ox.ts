import { PetType, Trigger } from "@/lib/types";
import { MelonPerk } from "@/lib/perks/melon";

export const Ox: PetType = {
  name: "Ox",
  sprite: "/sap/Ox.webp",
  tier: 3,
  baseAttack: 1,
  baseHealth: 3,
  isToken: false,
  ability: {
    trigger: Trigger.friend_ahead_faints,
    fn: (ctx) => {
      if (ctx.triggerCount > 1) return;
      ctx.self.attack += ctx.level;
      ctx.self.perk = { ...MelonPerk };
    },
  },
  description: (level: number) =>
    `Friend ahead faints: Gain Melon perk and +${level} attack. Works 1 time per turn.\n\nSame as Kangaroo.`,
};