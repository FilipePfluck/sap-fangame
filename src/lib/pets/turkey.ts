import { PetType, Trigger } from "@/lib/types";

export const Turkey: PetType = {
  name: "Turkey",
  sprite: "/sap/Turkey.webp",
  tier: 5,
  baseAttack: 3,
  baseHealth: 4,
  isToken: false,
  ability: {
    trigger: Trigger.friend_summoned,
    fn: (ctx) => {
      const index = ctx.summonedIndex;
      if (index === undefined) return;
      const summoned = ctx.team[index];
      if (!summoned || summoned.health <= 0) return;
      summoned.attack += 3 * ctx.level;
      summoned.health += ctx.level;
    },
  },
  description: (level: number) =>
    `Friend summoned: Give it +${3 * level} attack and +${level} health.`,
};