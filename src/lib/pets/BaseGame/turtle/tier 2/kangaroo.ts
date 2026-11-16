import { StaticPet, Trigger, Tag } from "@/lib/types";
import { createAbilityMap } from "@/lib/pets/ability";

export const Kangaroo: Readonly<StaticPet> = {
  name: "Kangaroo",
  id: 14,
  sprite: "/sap/Kangaroo.webp",
  tier: 2,
  baseAttack: 2,
  baseHealth: 2,
  isToken: false,
  tags: [Tag.Guard],
  superTags: 0,
  abilities: createAbilityMap({
    trigger: Trigger.friend_ahead_attacks,
    fn: (ctx) => {
      ctx.self.attack += ctx.level;
      ctx.self.health += ctx.level;
    },
  }),
  description: (level: number) =>
    `Friend ahead attacks: Gain +${level} attack and +${level} health.`,
};