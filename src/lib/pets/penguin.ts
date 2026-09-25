import { PetInstance, PetType, Trigger } from "@/lib/types";
import { pickN } from "@/lib/utils/random";

export const Penguin: PetType = {
  name: "Penguin",
  sprite: "/sap/Penguin.png",
  tier: 4,
  baseAttack: 2,
  baseHealth: 3,
  isToken: false,
  ability: {
    trigger: Trigger.start_of_turn,
    fn: (ctx) => {
      const eligibleFriends = ctx.board.filter(
        (friend): friend is PetInstance =>
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
  },
  description: (level: number) =>
    `Start of turn: Give two level 2 or higher friends +${level} attack and +${level} health.\n\nThis will buff up to 2 lvl 2 or 3 friends (not including itself). If there are no lvl 2/3 friends, it will buff none. If there are more than two, it will buff a random selection of those pets.`,
};