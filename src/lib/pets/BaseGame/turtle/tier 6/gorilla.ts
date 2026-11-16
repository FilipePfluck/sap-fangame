import { StaticPet, Trigger, Tag } from "@/lib/types";
import { createAbilityMap, tryIncrementTriggerCount } from "@/lib/pets/ability";
import { CoconutPerk } from "@/lib/perks/coconut";

export const Gorilla: Readonly<StaticPet> = {
  name: "Gorilla",
  id: 55,
  sprite: "/sap/Gorilla.webp",
  tier: 6,
  baseAttack: 7,
  baseHealth: 10,
  isToken: false,
  tags: [Tag.Hurt],
  superTags: 0,
  abilities: createAbilityMap({
    trigger: Trigger.hurt,
    fn: (ctx) => {
      if (!tryIncrementTriggerCount(ctx.self, Trigger.hurt, ctx.level)) return;
      // TODO - Gain the perk through a "gain perk" action that fires
      // friend-ate-food triggers (e.g. Rabbit), instead of setting it directly.
      ctx.self.perk = { ...CoconutPerk };
    },
  }),
  description: (level: number) =>
    `Hurt: Gain Coconut. Works ${level} ${level === 1 ? "time" : "times"} per turn.`,
};
