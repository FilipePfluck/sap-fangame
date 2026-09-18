import type { PetType, FoodType, ShopPet, ShopFood, ShopState } from "@/lib/types";
import { z } from "zod";
import { pickN, pickRandom } from "@/lib/utils/random";

// Hard ceiling on total shop size (pets + food combined). The turn-based
// slot counts below are just how many *new* items generateShop rolls each
// turn — abilities that stock extra pets/food (e.g. Pigeon) can push the
// shop past that normal count, but never past this combined cap.
export const MAX_SHOP_SLOTS = 10;

function getPetSlotCount(turn: number): number {
  if (turn >= 9) return 5;
  if (turn >= 5) return 4;
  return 3;
}

function getFoodSlotCount(turn: number): number {
  if (turn >= 5) return 2;
  return 1;
}

export function getUnlockedTiers(turn: number): number[] {
  const tiers: number[] = [1];
  if (turn >= 3) tiers.push(2);
  if (turn >= 5) tiers.push(3);
  if (turn >= 7) tiers.push(4);
  if (turn >= 9) tiers.push(5);
  if (turn >= 11) tiers.push(6);
  return tiers;
}

export type GenerateShopArgs = {
  turn: number;
  pack: PetType[];
  foodTypes: FoodType[];
  frozenPets?: ShopPet[];
  frozenFoods?: ShopFood[];
};

export type GeneratedShop = {
  shopPets: ShopPet[];
  shopFoods: ShopFood[];
};

export function generateShop({
  turn,
  pack,
  foodTypes,
  frozenPets = [],
  frozenFoods = [],
}: GenerateShopArgs): GeneratedShop {
  const unlockedTiers = getUnlockedTiers(turn);
  const petPool = pack.filter((p) => unlockedTiers.includes(p.tier));
  const foodPool = foodTypes.filter((f) => unlockedTiers.includes(f.tier));

  const petSlots = getPetSlotCount(turn);
  const foodSlots = getFoodSlotCount(turn);

  const shopPets: ShopPet[] = frozenPets.map((p) => ({ ...p, frozen: true }));
  const shopFoods: ShopFood[] = frozenFoods.map((f) => ({ ...f, frozen: true }));

  const petsToFill = petSlots - shopPets.length;
  for (let i = 0; i < petsToFill; i++) {
    if (petPool.length === 0) break;
    shopPets.push({ type: pickRandom(petPool).name, frozen: false });
  }

  const foodsToFill = foodSlots - shopFoods.length;
  for (let i = 0; i < foodsToFill; i++) {
    if (foodPool.length === 0) break;
    shopFoods.push({ type: pickRandom(foodPool).name, frozen: false });
  }

  return { shopPets, shopFoods };
}

const MAX_TIER = 6;

// The level-up reward draws from the tier just above what's currently unlocked.
export function getRewardTier(turn: number): number {
  return Math.min(Math.max(...getUnlockedTiers(turn)) + 1, MAX_TIER);
}

function totalSlots(shop: ShopState): number {
  return shop.shopPets.length + shop.shopFoods.length;
}

// Request-body fields carrying the client's currently frozen shop positions.
export const FrozenPositionsShape = {
  frozenPetPositions: z.array(z.number().int().min(0)).default([]),
  frozenFoodPositions: z.array(z.number().int().min(0)).default([]),
};

// The shop items at the given positions (out-of-range positions are ignored).
export function pickFrozenItems(
  shop: ShopState,
  petPositions: number[],
  foodPositions: number[]
): { frozenPets: ShopPet[]; frozenFoods: ShopFood[] } {
  return {
    frozenPets: petPositions.filter((i) => i < shop.shopPets.length).map((i) => shop.shopPets[i]),
    frozenFoods: foodPositions.filter((i) => i < shop.shopFoods.length).map((i) => shop.shopFoods[i]),
  };
}

// Marks which shop items the player has frozen. The client only reports
// frozen positions on actions, so this syncs the flags before abilities stock
// new items.
export function applyFrozenFlags(
  shop: ShopState,
  petPositions: number[],
  foodPositions: number[]
): ShopState {
  return {
    shopPets: shop.shopPets.map((p, i) => ({ ...p, frozen: petPositions.includes(i) })),
    shopFoods: shop.shopFoods.map((f, i) => ({ ...f, frozen: foodPositions.includes(i) })),
  };
}

// Makes room for `needed` new items by deleting existing ones (mutates
// `shop`). Frozen items and `protectedItems` are never deleted, so they can
// block stocking. Stocking food pushes out pets from the rightmost pet;
// stocking pets pushes out foods from the leftmost food. If there are no
// pets to delete for food, the leftmost food goes; if there are no foods to
// delete for pets, the rightmost pet goes.
export function freeShopSlots(
  shop: ShopState,
  needed: number,
  kind: "pet" | "food",
  protectedItems: Set<object> = new Set()
): void {
  const evictOne = (list: { frozen: boolean }[], fromRight: boolean) => {
    const deletable = (item: { frozen: boolean }) => !item.frozen && !protectedItems.has(item);
    const idx = fromRight
      ? list.findLastIndex(deletable)
      : list.findIndex(deletable);
    if (idx === -1) return false;
    list.splice(idx, 1);
    return true;
  };
  while (totalSlots(shop) + needed > MAX_SHOP_SLOTS) {
    const evicted =
      kind === "food"
        ? evictOne(shop.shopPets, true) || evictOne(shop.shopFoods, false)
        : evictOne(shop.shopFoods, false) || evictOne(shop.shopPets, true);
    if (!evicted) break;
  }
}

// Stocks one food, evicting an unfrozen item if the shop is full. `justStocked`
// tracks items added by the same ability so a batch never evicts itself.
export function stockFood(shop: ShopState, type: string, justStocked: Set<object>): void {
  freeShopSlots(shop, 1, "food", justStocked);
  if (totalSlots(shop) >= MAX_SHOP_SLOTS) return;
  const item: ShopFood = { type, frozen: false };
  shop.shopFoods.push(item);
  justStocked.add(item);
}

// Adds two random next-tier pets as a chained pair (buying one removes the
// other). A full shop makes room by deleting unfrozen items; frozen items win,
// so only as many as fit are added. A lone pet is just a normal shop pet, so
// it gets no chainId.
export function addLevelUpReward(
  shop: ShopState,
  turn: number,
  pack: PetType[],
  chainId: string = crypto.randomUUID()
): ShopState {
  const tier = getRewardTier(turn);
  const candidates = pack.filter((p) => !p.isToken && p.tier === tier);
  const want = Math.min(2, candidates.length);
  if (want === 0) return shop;

  const next: ShopState = { shopPets: [...shop.shopPets], shopFoods: [...shop.shopFoods] };
  freeShopSlots(next, want, "pet");
  const picks = pickN(candidates, Math.min(want, MAX_SHOP_SLOTS - totalSlots(next)));

  const chained = picks.length === 2;
  for (const p of picks) {
    next.shopPets.push({ type: p.name, frozen: false, ...(chained ? { chainId } : {}) });
  }
  return next;
}
