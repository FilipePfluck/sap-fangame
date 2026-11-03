import { StaticPet, Trigger } from "@/lib/types";
import { createAbilityMap, tryIncrementTriggerCount } from "@/lib/pets/ability";

export const Seagull: Readonly<StaticPet> = {
  name: "Seagull",
  sprite: "/sap/Seagull.webp",
  tier: 4,
  baseAttack: 4,
  baseHealth: 3,
  isToken: false,
  abilities: createAbilityMap({
    trigger: Trigger.friend_summoned,
    fn: (ctx) => {
      if (ctx.summonedIndex === undefined) return;
      const summoned = ctx.team[ctx.summonedIndex];
      const perk = ctx.self.perk;
      if (!summoned || !perk || summoned.perk?.name === perk.name) return;
      if (
        !tryIncrementTriggerCount(ctx.self, Trigger.friend_summoned, ctx.level)
      ) {
        return;
      }
      summoned.perk = { ...perk };
    },
  }),
  description: (level: number) =>
    `Friend summoned: Copy this pet's food perk to it. Works ${level} ${level === 1 ? "time" : "times"} per turn.`,
};
