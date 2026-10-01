import { PetType, Trigger } from "@/lib/types";

export const Jerboa: PetType = {
  name: "Jerboa",
  sprite: "/sap/Jerboa.png",
  tier: 4,
  baseAttack: 1,
  baseHealth: 3,
  isToken: false,
  ability: {
    trigger: Trigger.friend_ate_food,
    fn: (ctx) => {
      if (ctx.foodGroup !== "apple" || ctx.self.foodTriggersThisTurn) return;
      ctx.self.foodTriggersThisTurn = 1;
      for (const friend of ctx.friends) {
        if (friend === ctx.self) continue;
        friend.attack += ctx.level;
        friend.health += ctx.level;
      }
    },
  },
  description: (level: number) =>
    `Eats Apple: Give friends +${level} attack and +${level} health. Works 1 times per turn.`,
};