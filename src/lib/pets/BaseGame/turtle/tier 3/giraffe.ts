import { PetInstance, StaticPet, Trigger, Tag } from "@/lib/types";
import { createAbilityMap } from "@/lib/pets/ability";

export const Giraffe: Readonly<StaticPet> = {
  name: "Giraffe",
  id: 27,
  sprite: "/sap/Giraffe.webp",
  tier: 3,
  baseAttack: 1,
  baseHealth: 2,
  isToken: false,
  tags: [Tag.Buff],
  superTags: 0,
  abilities: createAbilityMap({
    trigger: Trigger.start_of_turn,
    fn: (ctx) => {
      const friend = ctx.board
        .slice(0, ctx.selfIndex)
        .filter((pet): pet is PetInstance => pet !== null && pet.health > 0)
        .pop();
      if (!friend) return;
      friend.attack += ctx.level;
      friend.health += ctx.level;
    },
  }),
  description: (level: number) =>
    `Start of turn: Give the nearest friend ahead +${level} attack and +${level} health.`,
};