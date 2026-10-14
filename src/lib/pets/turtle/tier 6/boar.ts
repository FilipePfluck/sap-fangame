import { StaticPet, Trigger } from "@/lib/types";
import { createAbilityMap } from "@/lib/pets/ability";

export const Boar: Readonly<StaticPet> = {
  name: "Boar",
  sprite: "/sap/boar.webp",
  tier: 6,
  baseAttack: 10,
  baseHealth: 6,
  isToken: false,
  abilities: createAbilityMap({
    trigger: Trigger.before_attack,
    fn: (ctx) => {
      ctx.self.attack += 4 * ctx.level;
      ctx.self.health += 2 * ctx.level;
    },
  }),
  description: (level: number) => `Before attack: Gain +${4 * level} attack and +${2 * level} health.`,
};
