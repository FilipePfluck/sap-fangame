import { StaticPet, Trigger } from "@/lib/types";
import { createAbilityMap } from "@/lib/pets/ability";
import { grantExperience } from "@/lib/game/merge";

const FRIENDS_GIVEN_EXPERIENCE = 2;

// What a Flounder transforms into.
export const AdultFlounder: Readonly<StaticPet> = {
  name: "Adult Flounder",
  sprite: "/sap/Adult_Flounder.png",
  tier: 5,
  baseAttack: 2,
  baseHealth: 4,
  isToken: true,
  abilities: createAbilityMap({
    trigger: Trigger.transformed,
    fn: (ctx) => {
      const backMost = ctx.friends
        .filter((pet) => pet !== ctx.self)
        .slice(-FRIENDS_GIVEN_EXPERIENCE);
      for (const friend of backMost) grantExperience(friend, ctx.level);
    },
  }),
  description: (level: number) =>
    `Transformed: Give the two back-most friends +${level} experience.`,
};
