import type { PetType } from "@/lib/types";
import { pickRandom } from "@/lib/utils/random";
import { isAlive } from "@/lib/utils/combat";

export const Ant: PetType = {
  name: "Ant",
  sprite: "/sap/ant.webp",
  tier: 1,
  baseAttack: 2,
  baseHealth: 2,
  isToken: false,
  ability: {
    trigger: "faint",
    fn: (ctx) => {
      const friends = ctx.team.filter((p, i) => i !== ctx.selfIndex && isAlive(p));
      if (friends.length === 0) return;
      const target = pickRandom(friends);
      target.attack += ctx.level;
      target.health += ctx.level;
    },
  },
  description: (level: number) =>
    `Faint: Give one random friend +${level} attack and +${level} health.`,
};
