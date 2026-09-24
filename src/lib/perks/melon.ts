import type { DefensivePerk } from "@/lib/types";

export const MelonPerk: DefensivePerk = {
  name: "Melon",
  description: "Take 20 less damage, once.",
  usesRemaining: 1,

  blocksFor: 20,
  minimumDamageTaken: 0,
  blocksAbilityDamage: true,
  blocksDirectDamage: true,
};
