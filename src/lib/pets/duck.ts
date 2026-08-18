import type { PetType } from "@/lib/types";

export const Duck: PetType = {
  name: "Duck",
  sprite: "/sap/duck.webp",
  tier: 1,
  baseAttack: 2,
  baseHealth: 2,
  isToken: false,
  ability: {
    trigger: "sell",
    fn: (ctx) => {
      for (const shopPet of ctx.shop.shopPets) {
        shopPet.tempHealthBonus = (shopPet.tempHealthBonus ?? 0) + 1;
      }
    },
  },
};
