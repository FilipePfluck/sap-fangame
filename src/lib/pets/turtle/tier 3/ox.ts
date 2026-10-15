import { StaticPet, Trigger } from "@/lib/types";
import { MelonPerk } from "@/lib/perks/melon";
import {
  createAbilityMap,
  tryIncrementTriggerCount,
} from "@/lib/pets/ability";

const TRIGGER_LIMIT = 1;

export const Ox: Readonly<StaticPet> = {
  name: "Ox",
  sprite: "/sap/Ox.webp",
  tier: 3,
  baseAttack: 1,
  baseHealth: 3,
  isToken: false,
  abilities: createAbilityMap({
    trigger: Trigger.friend_ahead_faints,
    fn: (ctx) => {
      if (
        !tryIncrementTriggerCount(
          ctx.self,
          Trigger.friend_ahead_faints,
          TRIGGER_LIMIT
        )
      ) {
        return;
      }
      ctx.self.attack += ctx.level;
      ctx.self.perk = { ...MelonPerk };
    },
  }),
  description: (level: number) =>
    `Friend ahead faints: Gain Melon perk and +${level} attack. Works 1 time per turn.`,
};
