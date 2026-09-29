import { PetType, Trigger } from "@/lib/types";

export const Dog: PetType = {
  name: "Dog",
  sprite: "/sap/Dog.png",
  tier: 3,
  baseAttack: 3,
  baseHealth: 2,
  isToken: false,
  ability: {
    trigger: Trigger.friend_summoned,
    fn: (ctx) => {
      const attack = 2 * ctx.level;
      const health = ctx.level;
      ctx.self.attack += attack;
      ctx.self.health += health;
      if (ctx.inShop) {
        ctx.self.tempAttack = (ctx.self.tempAttack ?? 0) + attack;
        ctx.self.tempHealth = (ctx.self.tempHealth ?? 0) + health;
      }
    },
  },
  description: (level: number) =>
    `Friend summoned: Gain +${2 * level} attack and +${level} health until next turn.`,
};