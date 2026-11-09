import { OffensivePerk } from "@/lib/game/perk";

export const SteakPerk: OffensivePerk = {
  name: "Steak",
  description: "Attack with +20 damage, once.",
  usesRemaining: 1,

  instantKill: false,
  extraDamage: 20,
}
