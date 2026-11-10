import { StaticPet, Trigger, Tag } from "@/lib/types";
import { createAbilityMap } from "@/lib/pets/ability";

export const Peacock: Readonly<StaticPet> = {
  name: "Peacock",
  id: 15,
  sprite: "/sap/Peacock.webp",
  tier: 2,
  baseAttack: 2,
  baseHealth: 5,
  isToken: false,
  tags: [Tag.Hurt],
  superTags: 0,
  abilities: createAbilityMap({
    trigger: Trigger.hurt,
    fn: (ctx) => {
      ctx.self.attack += 3 * ctx.level;
    },
  }),
  description: (level: number) =>
    `Hurt: Gain +${3 * level} attack.`,
};