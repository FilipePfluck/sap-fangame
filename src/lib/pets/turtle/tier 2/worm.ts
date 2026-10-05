import { Trigger, type StaticPet } from "@/lib/types";

const APPLE_NAMES = ["Apple", "Better Apple", "Best Apple"] as const;

export const Worm: Readonly<StaticPet> = {
  name: "Worm",
  sprite: "/sap/Worm.png",
  tier: 2,
  baseAttack: 1,
  baseHealth: 4,
  isToken: false,
  ability: {
    trigger: Trigger.start_of_turn,
    fn: (ctx) => ctx.addShopFood(APPLE_NAMES[ctx.level - 1], 1),
  },
  description: (level: number) =>
    `Start of turn: Stock one 2-gold ${APPLE_NAMES[level - 1]}.`,
};