import { PetType, Trigger } from "@/lib/types";
import { pickRandom } from "@/lib/utils/random";

const SPIDER_POOL = [
  "Dodo",
  "Badger",
  "Dolphin",
  "Giraffe",
  "Elephant",
  "Camel",
  "Ox",
  "Rabbit",
  "Dog",
  "Sheep",
];
const XP_BY_LEVEL = [0, 2, 5] as const;

export const Spider: PetType = {
  name: "Spider",
  sprite: "/sap/Spider.webp",
  tier: 2,
  baseAttack: 2,
  baseHealth: 2,
  isToken: false,
  ability: {
    trigger: Trigger.faint,
    fn: (ctx) => {
      const type = pickRandom(SPIDER_POOL);
      ctx.summon(
        {
          type,
          attack: 2 * ctx.level,
          health: 2 * ctx.level,
          perk: null,
          xp: XP_BY_LEVEL[ctx.level - 1],
          level: ctx.level,
        },
        ctx.selfIndex
      );
    },
  },
  description: (level: number) =>
    `Faint: Summon one level ${level} tier 3 pet as a ${2 * level}/${2 * level}.`,
};