import type { StaticPet } from "@/lib/types";
import { Tag } from "@/lib/types";
import { PeanutPerk } from "@/lib/perks/peanut";

export const Scorpion: Readonly<StaticPet> = {
  name: "Scorpion",
  sprite: "/sap/scorpion.webp",
  tier: 5,
  baseAttack: 1,
  baseHealth: 3,
  isToken: false,
  tags: [Tag.Perk],
  superTags: 0,
  abilities: new Map(),
  innatePerk: PeanutPerk, // TODO: Should be updated to "Summon" trigger - gaining a Perk is distinct from being innate (ex: Rabbit triggers on gain, not innate)
  description: "Summoned: Gain Peanut perk.",
};
