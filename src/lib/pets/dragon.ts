import { PetType, Trigger } from "@/lib/types";

export const Dragon: PetType = {
  name: "Dragon",
  sprite: "/sap/Dragon.png",
  tier: 6,
  baseAttack: 3,
  baseHealth: 8,
  isToken: false,
  ability: {
    trigger: Trigger.friend_bought,
    fn: (ctx) => {
      if (ctx.boughtPetTier !== 1) return;
      const triggers = ctx.self.friendBuysThisTurn ?? 0;
      if (triggers >= 4) return;
      ctx.self.friendBuysThisTurn = triggers + 1;
      for (const friend of ctx.board) {
        if (!friend || friend === ctx.self || friend.health <= 0) continue;
        friend.attack += ctx.level;
        friend.health += ctx.level;
      }
    },
  },
  description: (level: number) =>
    `Tier 1 friend bought: Give friends +${level} attack and +${level} health. Works 4 times per turn.\n\nWorks if it is any tier 1 pet bought (newly summoned or combined on an existing tier 1).`,
};