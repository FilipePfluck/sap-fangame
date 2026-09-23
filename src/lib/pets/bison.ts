import type { PetType } from "@/lib/types";

export const Bison: PetType = {
  name: "Bison",
  sprite: "/sap/bison.webp",
  tier: 4,
  baseAttack: 4,
  baseHealth: 4,
  isToken: false,
  ability: {
    trigger: "end-turn",
    fn: (ctx) => {
      const firstBisonIndex = ctx.board.findIndex((p) => p?.type === "Bison");
      if (ctx.selfIndex !== firstBisonIndex) return;
      const hasLevel3Friend = ctx.board.some(
        (p, i) => p !== null && i !== ctx.selfIndex && p.level === 3
      );
      if (!hasLevel3Friend) return;
      ctx.self.attack += 2 * ctx.level;
      ctx.self.health += 2 * ctx.level;
    },
  },
  description: (level: number) =>
    `End turn: If this has a level 3 friend, gain +${2 * level} attack and +${2 * level} health. Works for 1 Bison.`,
};
