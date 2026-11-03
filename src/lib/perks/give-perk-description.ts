import type { BasePerkType } from "@/lib/types";

// The shop text of a food that gives `perk`.
export function givePerkDescription(perk: BasePerkType): string {
  return `Give one pet the ${perk.name} perk. ${perk.description}`;
}
