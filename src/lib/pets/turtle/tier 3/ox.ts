import { StaticPet, Trigger } from "@/lib/types";
import { MelonPerk } from "@/lib/perks/turtle/melon";

const TRIGGER_LIMIT = 1;

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
      const triggers = ctx.self.friendAheadFaintsThisTurn ?? 0;
      if (triggers >= TRIGGER_LIMIT) return;
      ctx.self.friendAheadFaintsThisTurn = triggers + 1;
      ctx.self.attack += ctx.level;
      ctx.self.perk = { ...MelonPerk };
    },
  },
  description: (level: number) =>
    `Friend ahead faints: Gain Melon perk and +${level} attack. Works 1 time per turn.`,
};