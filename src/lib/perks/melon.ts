import { DefensivePerk } from "@/lib/game/perk";

export const MelonPerk: DefensivePerk = {
  name: "Melon",
  description: "Take 20 damage less, once.",
  usesRemaining: 1,

  blocksFor: 20,
  minimumDamageTaken: 0,
  blocksAbilityDamage: true,
  blocksDirectDamage: true,
};
