import { OffensivePerk, DOES_NOT_DECAY } from "@/lib/types";

export const MeatBonePerk: OffensivePerk = {
  name: "Meat Bone",
  description: "Attack with +3 damage",
  usesRemaining: DOES_NOT_DECAY,

  instantKill: false,
  extraDamage: 3,
}
