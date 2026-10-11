import { StaticPet, Trigger } from "@/lib/types";
import { createAbilityMap, tryIncrementTriggerCount } from "@/lib/pets/ability";
import { createPet } from "@/lib/game/pet";
import { BattleActions } from "@/lib/game/ability-actions";
import { ZombieFly } from "@/lib/pets/turtle/token/zombie-fly";

const TRIGGER_LIMIT = 3;

export const Fly: Readonly<StaticPet> = {
  name: "Fly",
  sprite: "/sap/Fly.png",
  tier: 6,
  baseAttack: 4,
  baseHealth: 4,
  isToken: false,
  abilities: createAbilityMap({
    trigger: Trigger.friend_faints,
    fn: (ctx) => {
      if (
        !tryIncrementTriggerCount(
          ctx.self,
          Trigger.friend_faints,
          TRIGGER_LIMIT
        )
      ) {
        return;
      }
      const zombieFly = createPet(ZombieFly);
      zombieFly.attack *= ctx.level;
      zombieFly.health *= ctx.level;
      new BattleActions(ctx).summon(
        zombieFly,
        ctx.faintedIndex ?? ctx.selfIndex
      );
    },
  }),
  description: (level: number) =>
    `Friend faints: Summon one ${ZombieFly.baseAttack * level}/${ZombieFly.baseHealth * level} Zombie Fly in its place. Works 3 times per turn.`,
};
