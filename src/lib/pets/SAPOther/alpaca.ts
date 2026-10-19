import { StaticPet, Trigger } from "@/lib/types";
import { createAbilityMap, tryIncrementTriggerCount } from "@/lib/pets/ability";
import { grantExperience } from "@/lib/game/merge";

const SHOP_EXPERIENCE = 1;
const BATTLE_EXPERIENCE = 3;

export const Alpaca: Readonly<StaticPet> = {
  name: "Alpaca",
  sprite: "/sap/Alpaca.webp",
  tier: 6,
  baseAttack: 3,
  baseHealth: 7,
  isToken: false,
  abilities: createAbilityMap({
    trigger: Trigger.friend_summoned,
    fn: (ctx) => {
      if (ctx.summonedIndex === undefined) return;
      const summoned = ctx.team[ctx.summonedIndex];
      if (!summoned || summoned.health <= 0) return;
      if (
        !tryIncrementTriggerCount(ctx.self, Trigger.friend_summoned, ctx.level)
      ) {
        return;
      }
      grantExperience(
        summoned,
        ctx.inShop ? SHOP_EXPERIENCE : BATTLE_EXPERIENCE
      );
    },
  }),
  description: (level: number) =>
    `Friend summoned: Give it +${SHOP_EXPERIENCE} experience. Tripled in battle. Works ${level} ${level === 1 ? "time" : "times"} per turn.`,
};
