import { StaticPet, Trigger, Tag } from "@/lib/types";
import { livingPets } from "@/lib/utils/combat";
import { createAbilityMap } from "@/lib/pets/ability";

export const Armadillo: Readonly<StaticPet> = {
  name: "Armadillo",
  id: 41,
  sprite: "/sap/Armadillo.webp",
  tier: 5,
  baseAttack: 4,
  baseHealth: 8,
  isToken: false,
  tags: [Tag.Hurt],
  superTags: 0,
  abilities: createAbilityMap({
    trigger: Trigger.start_of_battle,
    fn: (ctx) => {
      for (const target of livingPets([...ctx.team, ...ctx.enemyTeam])) {
        target.health += 8 * ctx.level;
      }
    },
  }),
  description: (level: number) =>
    `Start of battle: Give ALL pets +${8 * level} health.`
};