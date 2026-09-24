import {
  PetInstance,
  Trigger,
  TriggerPerk,
  DOES_NOT_DECAY,
} from "@/lib/types";

export const BreadPerk: TriggerPerk = {
  name: "Bread",
  description: "End of Turn -> Gain +7 health until next turn.",
  usesRemaining: DOES_NOT_DECAY,

  trigger: Trigger.end_turn,
};

export function breadEffect({ self }: { self: PetInstance }) {
  const BREAD_STRENGTH = 7;

  self.tempHealth = self.tempHealth ?? 0;

  // TODO - Extract temporary stat logic to a dedicate location - and likely decouple "real" stats from "temp" stats (i.e. don't increase HP based on tempHP)
  const distanceFromStatCap = 50 - self.health;
  const breadContribution = Math.min(distanceFromStatCap, BREAD_STRENGTH);

  self.tempHealth += breadContribution;
  self.health += breadContribution;
}