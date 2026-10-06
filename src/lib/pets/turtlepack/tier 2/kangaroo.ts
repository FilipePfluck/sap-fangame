import { StaticPet, Trigger } from "@/lib/types";

export const Kangaroo: Readonly<StaticPet> = {
  name: "Kangaroo",
  sprite: "/sap/Kangaroo.webp",
  tier: 2,
  baseAttack: 2,
  baseHealth: 2,
  isToken: false,
  ability: {
    trigger: Trigger.friend_ahead_attacks,
    fn: (ctx) => {
      ctx.self.attack += ctx.level;
      ctx.self.health += ctx.level;
    },
  },
  description: (level: number) =>
    `Friend ahead attacks: Gain +${level} attack and +${level} health.`,
};