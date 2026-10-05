import {
  BasePerkType,
  DOES_NOT_DECAY,
  PetInstance,
  Trigger,
  TriggerPerk,
} from "@/lib/types";

export const CakePerk: BasePerkType | TriggerPerk = {
  name: "Cake",
  description: "End of Turn -> Gain +1 gold sell value.",
  usesRemaining: DOES_NOT_DECAY,

  trigger: Trigger.end_turn,
};

export function cakeEffect({ self }: { self: PetInstance }) {
  self.sellValue = (self.sellValue ?? 0) + 1;
}
