import { CounterTrigger, Trigger, type PetType } from "@/lib/types";
import { removeHealth } from "@/lib/utils/combat";

export const Wolverine: PetType = {
  name: "Wolverine",
  sprite: "/sap/Wolverine.webp",
  tier: 6,
  baseAttack: 5,
  baseHealth: 7,
  isToken: false,
  ability: {
    trigger: Trigger.counter,
    counter: { trigger: CounterTrigger.friend_hurt, every: 4 },
    fn: (ctx) => {
      for (const enemy of ctx.enemyTeam) {
        removeHealth(enemy, { amount: 3 * ctx.level });
      }
    },
  },
  description: (level: number) =>
    `Four friends hurt: Remove ${3 * level} health from all enemies.`,
};