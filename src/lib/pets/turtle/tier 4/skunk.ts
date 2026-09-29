import { PetType, Trigger } from "@/lib/types";
import { removeHealth } from "@/lib/utils/combat";
import { livingPets } from "@/lib/utils/combat";

export const Skunk: PetType = {
  name: "Skunk",
  sprite: "/sap/skunk.webp",
  tier: 4,
  baseAttack: 3,
  baseHealth: 5,
  isToken: false,
  ability: {
    trigger: Trigger.start_of_battle,
    fn: (ctx) => {
      const enemies = livingPets(ctx.enemyTeam);
      if (enemies.length === 0) return;
      const target = enemies.reduce((highest, p) =>
        p.health > highest.health ? p : highest
      );
      removeHealth(target, 0.33 * ctx.level);
    },
  },
  description:
    (level: number) =>
    `Start of battle: Reduce the highest health enemy by ${level * 33}% health.`,
};
