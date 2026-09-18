import type { PetType } from "@/lib/types";

export const Hippo: PetType = {
  name: "Hippo",
  sprite: "/sap/hippo.webp",
  tier: 4,
  baseAttack: 4,
  baseHealth: 7,
  isToken: false,
  ability: {
    trigger: "knock-out",
    fn: (ctx) => {
      if (ctx.triggerCount > 3) return;
      ctx.self.attack += 3;
      ctx.self.health += 3;
    },
  },
  description: "Knock out: Gain +3 attack and +3 health. Works 3 times per battle.",
};
