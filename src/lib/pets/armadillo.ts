import { PetType, Trigger } from "@/lib/types";
import { livingPets } from "@/lib/utils/combat";

export const Armadillo: PetType = {
  name: "Armadillo",
  sprite: "/sap/Armadillo.webp",
  tier: 5,
  baseAttack: 4,
  baseHealth: 8,
  isToken: false,
  ability: {
    trigger: Trigger.start_of_battle,
    fn: (ctx) => {
      for (const target of livingPets([...ctx.team, ...ctx.enemyTeam])) {
        target.health += 8 * ctx.level;
      }
    },
  },
  description: (level: number) =>
    `Start of battle: Give ALL pets +${8 * level} health.\n\nAt the start of battle, the Armadillo will give a health buff to its friends and enemies, including itself.`,
};