import type { PetType } from "@/lib/types";

export const Scorpion: PetType = {
  name: "Scorpion",
  sprite: "/sap/scorpion.webp",
  tier: 5,
  baseAttack: 1,
  baseHealth: 3,
  isToken: false,
  ability: {
    trigger: "summoned",
    fn: (ctx) => {
      ctx.self.perk = "Peanut";
    },
  },
  description: "Summoned: Gain Peanut perk.",
};
