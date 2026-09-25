import { PetType, Trigger } from "@/lib/types";
import { livingPets } from "@/lib/utils/combat";

export const Crab: PetType = {
  name: "Crab",
  sprite: "/sap/crab.webp",
  tier: 2,
  baseAttack: 4,
  baseHealth: 1,
  isToken: false,
  ability: {
    trigger: Trigger.start_of_battle,
    fn: (ctx) => {
      const friendHealths = livingPets(ctx.team)
        .filter((friend) => friend !== ctx.self)
        .map((p) => p.health);
      if (friendHealths.length === 0) return;
      const healthiest = Math.max(...friendHealths);
      ctx.self.health += Math.round(healthiest * 0.25 * ctx.level);
    },
  },
  description:
    (level: number) => `Start of battle: Gain health equal to ${level * 25}% of the most healthy friend.`,
};
