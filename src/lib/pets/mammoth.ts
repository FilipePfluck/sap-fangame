import { PetType, Trigger } from "@/lib/types";
import { livingPets } from "@/lib/utils/combat";

export const Mammoth: PetType = {
  name: "Mammoth",
  sprite: "/sap/Mammoth.png",
  tier: 6,
  baseAttack: 4,
  baseHealth: 12,
  isToken: false,
  ability: {
    trigger: Trigger.faint,
    fn: (ctx) => {
      for (const friend of livingPets(ctx.team)) {
        if (friend === ctx.self) continue;
        friend.attack += 2 * ctx.level;
        friend.health += 2 * ctx.level;
      }
    },
  },
  description: (level: number) =>
    `Faint: Give all friends +${2 * level}/+${2 * level}.`,
};