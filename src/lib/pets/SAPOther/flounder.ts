import { StaticPet, Trigger } from "@/lib/types";
import { createAbilityMap, incrementTriggerCount } from "@/lib/pets/ability";
import { TransformPreserve, transformPet } from "@/lib/game/pet";
import { AdultFlounder } from "@/lib/pets/SAPOther/adult-flounder";

const FOODS_TO_TRANSFORM = 2;

export const Flounder: Readonly<StaticPet> = {
  name: "Flounder",
  sprite: "/sap/Flounder.webp",
  tier: 5,
  baseAttack: 2,
  baseHealth: 4,
  isToken: false,
  abilities: createAbilityMap({
    trigger: Trigger.friend_ate_food,
    fn: (ctx) => {
      if (ctx.self !== ctx.fedPet) return;
      const eaten = incrementTriggerCount(ctx.self, Trigger.friend_ate_food);
      if (eaten < FOODS_TO_TRANSFORM) return;
      transformPet(
        ctx.self,
        AdultFlounder,
        ctx.friends,
        new Map([[TransformPreserve.experience, false]])
      );
    },
  }),
  description: (level: number) =>
    `Eats two food: Transform and give the two back-most friends +${level} experience.`,
};
