import { StaticPet, Trigger } from "@/lib/types";
import {
  createAbilityMap,
  tryIncrementTriggerCount,
} from "@/lib/pets/ability";

const TRIGGER_LIMIT = 3;

export const Hippo: Readonly<StaticPet> = {
  name: "Hippo",
  sprite: "/sap/hippo.webp",
  tier: 4,
  baseAttack: 4,
  baseHealth: 7,
  isToken: false,
  abilities: createAbilityMap({
    trigger: Trigger.knock_out,
    fn: (ctx) => {
      if (
        !tryIncrementTriggerCount(ctx.self, Trigger.knock_out, TRIGGER_LIMIT)
      ) {
        return;
      }
      ctx.self.attack += 3 * ctx.level;
      ctx.self.health += 3 * ctx.level;
    },
  }),
  description:
    (level: number) =>
    `Knock out: Gain +${3 * level} attack and +${3 * level} health. Works 3 times per battle.`,
};
