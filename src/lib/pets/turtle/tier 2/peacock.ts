import { StaticPet, Trigger } from "@/lib/types";
import { createAbilityMap } from "@/lib/pets/ability";

export const Peacock: Readonly<StaticPet> = {
  name: "Peacock",
  sprite: "/sap/Peacock.webp",
  tier: 2,
  baseAttack: 2,
  baseHealth: 5,
  isToken: false,
  abilities: createAbilityMap({
    trigger: Trigger.hurt,
    fn: (ctx) => {
      ctx.self.attack += 3 * ctx.level;
    },
  }),
  description: (level: number) =>
    `Hurt: Gain +${3 * level} attack.`,
};