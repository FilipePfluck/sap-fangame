import { PetData, StaticPet, Trigger } from "@/lib/types";
import { pickN } from "@/lib/utils/random";
import { createAbilityMap } from "@/lib/pets/ability";

export const Penguin: Readonly<StaticPet> = {
  name: "Penguin",
  sprite: "/sap/Penguin.png",
  tier: 4,
  baseAttack: 2,
  baseHealth: 3,
  isToken: false,
  abilities: createAbilityMap({
    trigger: Trigger.start_of_turn,
    fn: (ctx) => {
      const eligibleFriends = ctx.board.filter(
        (friend): friend is PetData =>
          friend !== null &&
          friend !== ctx.self &&
          friend.health > 0 &&
          friend.level >= 2
      );
      for (const friend of pickN(eligibleFriends, 2)) {
        friend.attack += ctx.level;
        friend.health += ctx.level;
      }
    },
  }),
  description: (level: number) =>
    `Start of turn: Give two level 2 or higher friends +${level} attack and +${level} health.`,
};