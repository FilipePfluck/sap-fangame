import { PetType, Trigger } from "@/lib/types";

export const Flamingo: PetType = {
  name: "Flamingo",
  sprite: "/sap/Flamingo.png",
  tier: 2,
  baseAttack: 3,
  baseHealth: 2,
  isToken: false,
  ability: {
    trigger: Trigger.faint,
    fn: (ctx) => {
      const friends = ctx.team
        .slice(ctx.selfIndex + 1)
        .filter((friend) => friend.health > 0)
        .slice(0, 2 * ctx.level);
      for (const friend of friends) {
        friend.attack += ctx.level;
        friend.health += ctx.level;
      }
    },
  },
  description: (level: number) =>
    `Faint: Give the ${2 * level} nearest friends behind +${level}/+${level}.`,
};