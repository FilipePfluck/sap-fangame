import { PetInstance, TriggerPerk } from "@/lib/types";
import { mushroomEffect } from "@/lib/perks/mushroom";
import { honeyEffect } from "@/lib/perks/honey";
import { breadEffect } from "@/lib/perks/bread";
import { cakeEffect } from "@/lib/perks/cake";

// Used for routing perk calls to their triggers.  Cannot be placed directly on the perk data itself, as it
// functions present on the perk directly causes issues with serialization.
export function triggerEffect(
  perk: TriggerPerk,
  { ...args }
): {
  summonRequest?: PetInstance;
} {
  switch (perk.name) {
    case "Bread":
      breadEffect({ self: args["self"] });
      return {}

    case "Cake":
      cakeEffect({ self: args["self"] });
      return {};

    case "Honey":
      return { summonRequest: honeyEffect() };

    case "Mushroom":
      return { summonRequest: mushroomEffect({ self: args["self"] }) };
  }

  return {};
}



