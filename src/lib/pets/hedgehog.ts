import { PetType, Trigger } from "@/lib/types";
import { livingPets } from "@/lib/utils/combat";

export const Hedgehog: PetType = {
  name: "Hedgehog",
  sprite: "/sap/Hedgehog.webp",
  tier: 2,
  baseAttack: 4,
  baseHealth: 2,
  isToken: false,
  ability: {
    trigger: Trigger.faint,
    fn: (ctx) => {
      for (const pet of livingPets([...ctx.team, ...ctx.enemyTeam])) {
        ctx.dealAbilityDamage(pet, 2 * ctx.level);
      }
    },
  },
  description: (level: number) => `Faint: Deal ${2 * level} damage to ALL pets.`,
};