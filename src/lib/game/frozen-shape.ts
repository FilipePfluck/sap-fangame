import { z } from "zod";

// Request-body fields carrying the client's currently frozen shop positions.
// Lives apart from shop.ts so client code that imports the shop helpers
// doesn't pull zod into its bundle.
export const FrozenPositionsShape = {
  frozenPetPositions: z.array(z.number().int().min(0)).default([]),
  frozenFoodPositions: z.array(z.number().int().min(0)).default([]),
};
