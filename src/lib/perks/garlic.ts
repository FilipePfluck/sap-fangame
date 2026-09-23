import { DefensivePerk, DOES_NOT_DECAY } from "@/lib/types";

export const GarlicPerk: DefensivePerk = {
  name: "Garlic",
  description: "Take 2 less damage. It can't be reduced to less than 2.",
  usesRemaining: DOES_NOT_DECAY,

  blocksAbilityDamage: true,
  blocksDirectDamage: true,
  blocksFor: 2,
  minimumDamageTaken: 2,
};
