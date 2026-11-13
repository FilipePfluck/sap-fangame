import { StaticPet, Trigger, Tag } from "@/lib/types";
import { MelonPerk } from "@/lib/perks/melon";
import { numberToText } from "@/lib/utils/flavor-text";
import { createAbilityMap } from "@/lib/pets/ability";

export const Turtle: Readonly<StaticPet> = {
  name: "Turtle",
  id: 39,
  sprite: "/sap/Turtle.webp",
  tier: 4,
  baseAttack: 2,
  baseHealth: 5,
  isToken: false,
  tags: [Tag.Perk],
  superTags: 0,
  abilities: createAbilityMap({
    trigger: Trigger.faint,
    fn: (ctx) => {
      const friends = ctx.team
        .slice(ctx.selfIndex + 1)
        .filter((pet) => pet.health > 0)
        .slice(0, ctx.level);
      for (const friend of friends) {
        friend.perk = { ...MelonPerk };
      }
    },
  }),
  description: (level: number) =>
    `Faint: Give Melon perk to the ${level === 1 ? "nearest friend" : `${numberToText[level]} nearest friends`} behind.`,
};