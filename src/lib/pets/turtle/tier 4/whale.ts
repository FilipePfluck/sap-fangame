import { StaticPet, Trigger } from "@/lib/types";
import { createAbilityMap } from "@/lib/pets/ability";
import { BattleActions } from "@/lib/game/ability-actions";
import { xpForLevel } from "@/lib/game/board";

export const Whale: Readonly<StaticPet> = {
  name: "Whale",
  sprite: "/sap/Whale.webp",
  tier: 4,
  baseAttack: 3,
  baseHealth: 7,
  isToken: false,
  abilities: createAbilityMap(
    {
      trigger: Trigger.start_of_battle,
      fn: (ctx) => {
        const selfIndex = ctx.team.indexOf(ctx.self);
        const friend = ctx.team
          .slice(0, selfIndex)
          .findLast((pet) => pet.health > 0);
        if (!friend) return;

        ctx.team.splice(ctx.team.indexOf(friend), 1);
        // Stored at the level Whale has now: that is the level the friend
        // comes back at, even if Whale levels up before it faints.
        ctx.self.swallowedPets = [
          ...(ctx.self.swallowedPets ?? []),
          {
            type: friend.type,
            attack: friend.attack,
            health: friend.health,
            perk: null,
            xp: xpForLevel(ctx.level),
            level: ctx.level,
          },
        ];
      },
    },
    {
      trigger: Trigger.faint,
      fn: (ctx) => {
        const [released, ...remaining] = ctx.self.swallowedPets ?? [];
        if (!released) return;

        ctx.self.swallowedPets = remaining;
        new BattleActions(ctx).summon(released, ctx.selfIndex);
      },
    }
  ),
  description: (level: number) =>
    `Start of battle: Swallow the nearest friend ahead and release it as level ${level} on faint.`,
};
