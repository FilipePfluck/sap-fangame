import { StaticPet, Trigger, Tag } from "@/lib/types";
import { createAbilityMap } from "@/lib/pets/ability";

export const Dog: Readonly<StaticPet> = {
  name: "Dog",
  id: 24,
  sprite: "/sap/Dog.png",
  tier: 3,
  baseAttack: 3,
  baseHealth: 2,
  isToken: false,
  tags: [Tag.Summon],
  superTags: 0,
  abilities: createAbilityMap({
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
  }),
  description: (level: number) =>
    `Friend summoned: Gain +${2 * level} attack and +${level} health until next turn.`,
};