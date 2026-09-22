import type { PetType } from "@/lib/types";

export const Scorpion: PetType = {
  name: "Scorpion",
  sprite: "/sap/scorpion.webp",
  tier: 5,
  baseAttack: 1,
  baseHealth: 3,
  isToken: false,
  ability: null,
  innatePerk: "Peanut", // TODO: Should be updated to "Summon" trigger - gaining a Perk is distinct from being innate (ex: Rabbit triggers on gain, not innate)
  description: "Summoned: Gain Peanut perk.",
};
