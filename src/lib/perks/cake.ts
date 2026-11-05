import {
  PetData,
  Trigger,

} from "@/lib/types";
import { BasePerkType, DOES_NOT_DECAY, TriggerPerk } from "@/lib/game/perk";

export const CakePerk: BasePerkType | TriggerPerk = {
  name: "Cake",
  description: "End turn: Increase sell value by 1 gold.",
  usesRemaining: DOES_NOT_DECAY,

  trigger: Trigger.end_turn,
};

export function cakeEffect({ self }: { self: PetData }) {
  self.sellValue = (self.sellValue ?? 0) + 1;
}
