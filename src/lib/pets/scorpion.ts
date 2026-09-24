import type { PetType } from "@/lib/types";
import { PeanutPerk } from "@/lib/perks/peanut";

export const Scorpion: PetType = {
  name: "Scorpion",
  sprite: "/sap/scorpion.webp",
  tier: 5,
  baseAttack: 1,
  baseHealth: 3,
  isToken: false,
  ability: null,
  innatePerk: PeanutPerk, // TODO: Should be updated to "Summon" trigger - gaining a Perk is distinct from being innate (ex: Rabbit triggers on gain, not innate)
  description: "Summoned: Gain Peanut perk.",
};
