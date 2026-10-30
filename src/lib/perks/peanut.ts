import { DOES_NOT_DECAY, OffensivePerk } from "@/lib/types";

export const PeanutPerk: OffensivePerk = {
  name: "Peanut",
  description: "Knock out any pet attacked and hurt by this.",
  usesRemaining: DOES_NOT_DECAY,

  instantKill: true,
  extraDamage: 0,
};
