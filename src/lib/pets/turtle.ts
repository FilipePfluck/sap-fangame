import { PetType, Trigger } from "@/lib/types";
import { MelonPerk } from "@/lib/perks/melon";

export const Turtle: PetType = {
  name: "Turtle",
  sprite: "/sap/Turtle.webp",
  tier: 4,
  baseAttack: 2,
  baseHealth: 5,
  isToken: false,
  ability: {
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
  },
  description: (level: number) =>
    `Faint: Give Melon perk to the ${level === 1 ? "nearest friend" : `${level === 2 ? "two" : level} nearest friends`} behind.`,
};