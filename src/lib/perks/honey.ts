import { DOES_NOT_DECAY, PetData, Trigger, TriggerPerk } from "@/lib/types";

export const HoneyPerk: TriggerPerk = {
  name: "Honey",
  description: "Faint: Summon a 1/1 Bee.",
  usesRemaining: DOES_NOT_DECAY,

  trigger: Trigger.faint,
};

export function honeyEffect(): PetData {
  return { type: "Bee", attack: 1, health: 1, perk: null, xp: 0, level: 1 };
}