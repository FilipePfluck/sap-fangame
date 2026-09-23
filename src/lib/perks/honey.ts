import { DOES_NOT_DECAY, PetInstance, Trigger, TriggerPerk } from "@/lib/types";

export const HoneyPerk: TriggerPerk = {
  name: "Honey",
  description: "Faint -> Summon 1/1 Bee",
  usesRemaining: DOES_NOT_DECAY,

  trigger: Trigger.faint,
};

export function honeyEffect(): PetInstance {
  return { type: "Bee", attack: 1, health: 1, perk: null, xp: 0, level: 1 };
}