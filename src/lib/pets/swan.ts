import { PetType, Trigger } from "@/lib/types";

export const Swan: PetType = {
  name: "Swan",
  sprite: "/sap/swan.webp",
  tier: 2,
  baseAttack: 1,
  baseHealth: 2,
  isToken: false,
  ability: {
    trigger: Trigger.start_of_turn,
    fn: (ctx) => {
      ctx.goldGain(1);
    },
  },
  description: "Start of turn: Gain +1 gold.",
};
