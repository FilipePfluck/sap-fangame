import { Trigger, type StaticPet } from "@/lib/types";
import { CoconutPerk } from "@/lib/perks/turtle/coconut";

export const Gorilla: Readonly<StaticPet> = {
  name: "Gorilla",
  sprite: "/sap/Gorilla.webp",
  tier: 6,
  baseAttack: 7,
  baseHealth: 10,
  isToken: false,
  ability: {
    trigger: Trigger.hurt,
    fn: (ctx) => {
      if (ctx.triggerCount > ctx.level) return;
      ctx.self.perk = { ...CoconutPerk };
    },
  },
  description: (level: number) =>
    `Hurt: Gain Coconut. Works ${level} ${level === 1 ? "time" : "times"} per turn.`,
};