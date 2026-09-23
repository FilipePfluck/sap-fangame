import { DOES_NOT_DECAY, OffensivePerk } from "@/lib/types";

export const PeanutPerk: OffensivePerk = {
  name: "Peanut",
  description: "Faint any units that are damaged by this/",
  usesRemaining: DOES_NOT_DECAY,

  instantKill: true,
  extraDamage: 0,
};
