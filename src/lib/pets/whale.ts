import { Trigger, type PetSnapshot, type PetType } from "@/lib/types";

const SWALLOWED_FRIENDS = Symbol("swallowed-friends");

function experienceForLevel(level: number): number {
  if (level >= 3) return 5;
  if (level === 2) return 2;
  return 0;
}

export const Whale: PetType = {
  name: "Whale",
  sprite: "/sap/Whale.webp",
  tier: 4,
  baseAttack: 3,
  baseHealth: 7,
  isToken: false,
  ability: {
    trigger: Trigger.faint,
    fn: (ctx) => {
      const [swallowed, ...remaining] =
        ctx.state.get<PetSnapshot[]>(SWALLOWED_FRIENDS) ?? [];
      if (!swallowed) return;

      ctx.state.set(SWALLOWED_FRIENDS, remaining);
      ctx.summon(
        {
          ...swallowed,
          perk: null,
          xp: experienceForLevel(ctx.level),
          level: ctx.level,
        },
        ctx.selfIndex
      );
    },
  },
  additionalAbilities: [
    {
      trigger: Trigger.start_of_battle,
      fn: (ctx) => {
        const swallowed = ctx.swallowFriendAhead();
        if (!swallowed) return;
        const friends = ctx.state.get<PetSnapshot[]>(SWALLOWED_FRIENDS) ?? [];
        ctx.state.set(SWALLOWED_FRIENDS, [...friends, swallowed]);
      },
    },
  ],
  description: (level: number) =>
    `Start of battle: Swallow the nearest friend ahead and release it as level ${level} on faint.`,
};