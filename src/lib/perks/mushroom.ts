import { DOES_NOT_DECAY, PetData, Trigger, TriggerPerk, } from "@/lib/types";

export const MushroomPerk: TriggerPerk = {
  name: "Mushroom",
  description: "Faint: Come back as a 1/1.",
  usesRemaining: DOES_NOT_DECAY,

  trigger: Trigger.faint,
};

export function mushroomEffect({
  self,
}: {
  self: PetData;
}): PetData {
  return {
    type: self.type,
    attack: 1,
    health: 1,
    perk: null,
    xp: self.xp,
    level: self.level,
  };
}