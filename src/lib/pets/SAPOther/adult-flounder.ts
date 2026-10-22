import { StaticPet, Trigger } from "@/lib/types";
import { createAbilityMap } from "@/lib/pets/ability";
import { grantExperience } from "@/lib/game/merge";
import { Board } from "@/lib/game/board";

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
      const friends = new Board(ctx.friends.filter((pet) => pet !== ctx.self));
      for (const friend of friends.back(FRIENDS_GIVEN_EXPERIENCE)) {
        grantExperience(friend, ctx.level);
      }
    },
  }),
  description: (level: number) =>
    `Transformed: Give the two back-most friends +${level} experience.`,
};
