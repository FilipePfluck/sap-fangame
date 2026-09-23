import {
  Trigger,
  TriggerPerk,
  DOES_NOT_DECAY,
} from "@/lib/types";

export const ChiliPerk: TriggerPerk = {
  name: "Chili",
  description: "Attack second enemy for 5 damage",
  usesRemaining: DOES_NOT_DECAY,

  trigger: Trigger.after_attack,
};
