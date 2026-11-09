import { StaticPet, Trigger } from "@/lib/types";
import { removePercentageHealth } from "@/lib/utils/combat";
import { livingPets } from "@/lib/utils/combat";
import { createAbilityMap } from "@/lib/pets/ability";

export const Skunk: Readonly<StaticPet> = {
  name: "Skunk",
  sprite: "/sap/skunk.webp",
  tier: 4,
  baseAttack: 3,
  baseHealth: 5,
  isToken: false,
  abilities: createAbilityMap({
    trigger: Trigger.start_of_battle,
    fn: (ctx) => {
      const enemies = livingPets(ctx.enemyTeam);
      if (enemies.length === 0) return;
      const target = enemies.reduce((highest, p) =>
        p.health > highest.health ? p : highest
      );
      removePercentageHealth(target, 0.33 * ctx.level);
    },
  }),
  description:
    (level: number) =>
    `Start of battle: Reduce the highest health enemy by ${level * 33}% health.`,
};
