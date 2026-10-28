import { StaticPet, Trigger } from "@/lib/types";
import { PetInstance } from "@/lib/game/pet";

export const Hedgehog: Readonly<StaticPet> = {
  name: "Hedgehog",
  sprite: "/sap/Hedgehog.webp",
  tier: 2,
  baseAttack: 4,
  baseHealth: 2,
  isToken: false,
  ability: {
    trigger: Trigger.faint,
    fn: (ctx) => {
      for (const pet of [...ctx.team.living(), ...ctx.enemyTeam.living()]) {
        ctx.dealAbilityDamage(pet, 2 * ctx.level);
      }
    },
  },
  description: (level: number) => `Faint: Deal ${2 * level} damage to ALL pets.`,
};