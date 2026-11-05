import { BasePerkType } from "@/lib/game/perk";

// The shop text of a food that gives `perk`.
export function givePerkDescription(perk: BasePerkType): string {
  return `Give one pet the ${perk.name} perk. ${perk.description}`;
}
