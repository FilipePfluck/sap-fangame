import { StaticPet, Trigger } from "@/lib/types";
import { createAbilityMap } from "@/lib/pets/ability";
import { createPet } from "@/lib/game/pet";
import { BattleActions } from "@/lib/game/ability-actions";
import { ChiliPerk } from "@/lib/perks/chili";
import { Bus } from "@/lib/pets/turtle/token/bus";

export const Deer: Readonly<StaticPet> = {
  name: "Deer",
  sprite: "/sap/Deer.webp",
  tier: 4,
  baseAttack: 2,
  baseHealth: 2,
  isToken: false,
  abilities: createAbilityMap({
    trigger: Trigger.faint,
    fn: (ctx) => {
      const bus = createPet(Bus);
      bus.attack *= ctx.level;
      bus.health *= ctx.level;
      bus.perk = { ...ChiliPerk };
      new BattleActions(ctx).summon(bus, ctx.selfIndex);
    },
  }),
  description: (level: number) =>
    `Faint: Summon one ${Bus.baseAttack * level}/${Bus.baseHealth * level} Bus with Chili.`,
};
