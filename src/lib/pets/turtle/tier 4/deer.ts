import { createPet } from "@/lib/game/pet";
import { ChiliPerk } from "@/lib/perks/turtle/chili";
import { Trigger, type StaticPet } from "@/lib/types";
import { Bus } from "../tier 1/bus";

export const Deer: Readonly<StaticPet> = {
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