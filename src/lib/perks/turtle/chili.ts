import { BasePerkType, DOES_NOT_DECAY } from "@/lib/types";

export const ChiliPerk: BasePerkType = {
  name: "Chili",
  description: "Attack second enemy for 5 damage",
  usesRemaining: DOES_NOT_DECAY,
};
