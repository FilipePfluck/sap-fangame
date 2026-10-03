import { createPet } from "@/lib/game/pet";
import { ChiliPerk } from "@/lib/perks/chili";
import { Trigger, type PetType } from "@/lib/types";
import { Bus } from "./bus";

export const Deer: PetType = {
  name: "Deer",
  sprite: "/sap/Deer.webp",
  tier: 4,
  baseAttack: 2,
  baseHealth: 2,
  isToken: false,
  ability: {
    trigger: Trigger.faint,
    fn: (ctx) => {
      const bus = createPet(Bus);
      bus.attack *= ctx.level;
      bus.health *= ctx.level;
      bus.perk = { ...ChiliPerk };
      ctx.summon(bus, ctx.selfIndex);
    },
  },
  description: (level: number) =>
    `Faint: Summon one ${Bus.baseAttack * level}/${Bus.baseHealth * level} Bus with Chili.`,
};