import { StaticPet, Trigger } from "@/lib/types";
import { createAbilityMap } from "@/lib/pets/ability";

export const Swan: Readonly<StaticPet> = {
  name: "Swan",
  sprite: "/sap/swan.webp",
  tier: 2,
  baseAttack: 1,
  baseHealth: 2,
  isToken: false,
  abilities: createAbilityMap({
    trigger: Trigger.start_of_turn,
    fn: (ctx) => {
      ctx.goldGain(ctx.level);
    },
  }),
  description: (level: number) => `Start of turn: Gain +${level} gold.`,
};
