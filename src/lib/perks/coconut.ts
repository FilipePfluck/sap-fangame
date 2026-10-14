import type { DefensivePerk } from "@/lib/types";

export const CoconutPerk: DefensivePerk = {
  name: "Coconut",
  description: "Block damage, once.",
  usesRemaining: 1,
  blocksFor: 0,
  minimumDamageTaken: 0,
  blocksAllDamage: true,
  blocksAbilityDamage: true,
  blocksDirectDamage: true,
};