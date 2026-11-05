import {
  BasePerkType,
  DOES_NOT_DECAY,
  PetData,
  Trigger,
  TriggerPerk,
} from "@/lib/types";

export const CakePerk: BasePerkType | TriggerPerk = {
  name: "Cake",
  description: "End turn: Increase sell value by 1 gold.",
  usesRemaining: DOES_NOT_DECAY,

  trigger: Trigger.end_turn,
};

export function cakeEffect({ self }: { self: PetData }) {
  self.sellValue = (self.sellValue ?? 0) + 1;
}
