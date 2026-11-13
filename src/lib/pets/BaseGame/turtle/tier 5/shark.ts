import { StaticPet, Trigger, Tag } from "@/lib/types";
import { createAbilityMap } from "@/lib/pets/ability";

const STATS_PER_LEVEL = 2;

export const Shark: Readonly<StaticPet> = {
  name: "Shark",
  sprite: "/sap/Shark.png",
  tier: 5,
  baseAttack: 2,
  baseHealth: 2,
  isToken: false,
  tags: [Tag.Summon],
  superTags: 0,
  abilities: createAbilityMap({
    trigger: Trigger.friend_faints,
    fn: (ctx) => {
      ctx.self.attack += STATS_PER_LEVEL * ctx.level;
      ctx.self.health += STATS_PER_LEVEL * ctx.level;
    },
  }),
  description: (level: number) =>
    `Friend faints: Gain +${STATS_PER_LEVEL * level} attack and +${STATS_PER_LEVEL * level} health.`,
};
