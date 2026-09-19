"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Board, ShopState, PetInstance } from "@/lib/types";
import { PET_REGISTRY, getPetDescription } from "@/lib/pets";
import { FOOD_REGISTRY } from "@/lib/foods";
import { mergePets, openSlot, applyReorder } from "@/lib/game/merge";
import { applyFoodEffect, feedError, needsTarget } from "@/lib/game/food";
import { getPetCost, getFoodCost, getSellValue, ROLL_COST } from "@/lib/game/costs";
import { createPet } from "@/lib/game/pet";
import { STARTING_LIVES } from "@/lib/game/rules";
import { PET_SPRITES, FOOD_SPRITES } from "@/lib/sprites";
import ShopItem from "./ShopItem";
import BoardSlot from "./BoardSlot";
import BattleView from "./BattleView";

function frozenFromShop(shop: ShopState) {
  return {
    pets: new Set(shop.shopPets.flatMap((p, i) => (p.frozen ? [i] : []))),
    foods: new Set(shop.shopFoods.flatMap((f, i) => (f.frozen ? [i] : []))),
  };
}

function removeFrozenIndices(frozen: Set<number>, removed: number[]): Set<number> {
  const next = new Set<number>();
  for (const i of frozen) {
    if (removed.includes(i)) continue;
    next.add(i - removed.filter((r) => r < i).length);
  }
  return next;
}

const PET_MAP = PET_REGISTRY;
const FOOD_MAP = FOOD_REGISTRY;

type BattleData = {
  opponentTeam: PetInstance[];
  result: "WIN" | "DRAW" | "LOSS";
  steps: Array<{
    attackerTeam: PetInstance[];
    defenderTeam: PetInstance[];
    description: string;
  }>;
};

type NextState = {
  board: Board;
  shop: ShopState;
  gold: number;
  lives: number;
  trophies: number;
  turn: number;
};

type GameClientProps = {
  gameId: string;
  initialBoard: Board;
  initialShop: ShopState;
  initialGold: number;
  initialLives: number;
  initialTrophies: number;
  initialTurn: number;
};

export default function GameClient({
  gameId,
  initialBoard,
  initialShop,
  initialGold,
  initialLives,
  initialTrophies,
  initialTurn,
}: GameClientProps) {
  const router = useRouter();

  const [phase, setPhase] = useState<"shop" | "battle">("shop");
  const [board, setBoard] = useState<Board>(initialBoard);
  const [shop, setShop] = useState<ShopState>(initialShop);
  const [gold, setGold] = useState(initialGold);
  const [lives, setLives] = useState(initialLives);
  const [trophies, setTrophies] = useState(initialTrophies);
  const [turn, setTurn] = useState(initialTurn);

  const [selectedItem, setSelectedItem] = useState<{
    kind: "pet" | "food";
    index: number;
  } | null>(null);
  const [selectedBoardIndex, setSelectedBoardIndex] = useState<number | null>(null);
  const [frozenPets, setFrozenPets] = useState<Set<number>>(
    () => frozenFromShop(initialShop).pets
  );
  const [frozenFoods, setFrozenFoods] = useState<Set<number>>(
    () => frozenFromShop(initialShop).foods
  );
  const frozenBody = {
    frozenPetPositions: [...frozenPets],
    frozenFoodPositions: [...frozenFoods],
  };

  const [battleData, setBattleData] = useState<BattleData | null>(null);
  const [nextState, setNextState] = useState<NextState | null>(null);
  const [gameWon, setGameWon] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedFoodDef =
    selectedItem?.kind === "food" ? FOOD_MAP[shop.shopFoods[selectedItem.index]?.type] : undefined;
  const selectedFoodNeedsTarget = !selectedFoodDef || needsTarget(selectedFoodDef);

  function handleSelectShopPet(index: number) {
    setSelectedBoardIndex(null);
    setSelectedItem((prev) =>
      prev?.kind === "pet" && prev.index === index ? null : { kind: "pet", index }
    );
  }

  function handleSelectShopFood(index: number) {
    setSelectedBoardIndex(null);
    setSelectedItem((prev) =>
      prev?.kind === "food" && prev.index === index ? null : { kind: "food", index }
    );
  }

  function handleFreezeToggle(kind: "pet" | "food", index: number) {
    if (kind === "pet") {
      setFrozenPets((prev) => {
        const next = new Set(prev);
        next.has(index) ? next.delete(index) : next.add(index);
        return next;
      });
    } else {
      setFrozenFoods((prev) => {
        const next = new Set(prev);
        next.has(index) ? next.delete(index) : next.add(index);
        return next;
      });
    }
  }

  function handleContextMenu(
    e: React.MouseEvent,
    kind: "pet" | "food",
    index: number
  ) {
    e.preventDefault();
    handleFreezeToggle(kind, index);
  }

  async function handleBoardSlotClick(boardPosition: number) {
    if (selectedItem) {
      if (selectedItem.kind === "food" && !selectedFoodNeedsTarget) {
        setError("This food picks its own targets — use Buy");
        return;
      }

      if (selectedItem.kind === "pet") {
        await handleBuyPet(selectedItem.index, boardPosition);
      } else {
        await handleBuyFood(selectedItem.index, boardPosition);
      }
    } else {
      const pet = board[boardPosition];
      if (!pet) return;
      setSelectedBoardIndex((prev) => (prev === boardPosition ? null : boardPosition));
    }
  }

  async function handleBuyPet(shopPosition: number, boardPosition: number) {
    const shopPet = shop.shopPets[shopPosition];
    if (!shopPet) return;
    const petDef = PET_MAP[shopPet.type];
    if (!petDef) return;

    const cost = getPetCost(shopPet);
    if (gold < cost) { setError("Not enough gold"); return; }

    const freshPet = createPet(petDef, shopPet.tempHealthBonus);

    const occupant = board[boardPosition];
    let optimisticBoard: Board = [...board];
    if (occupant === null) {
      optimisticBoard[boardPosition] = freshPet;
    } else if (occupant.type === shopPet.type) {
      optimisticBoard[boardPosition] = mergePets(occupant, freshPet);
    } else {
      const shifted = openSlot(board, boardPosition);
      if (!shifted) { setError("Board is full"); return; }
      optimisticBoard = shifted;
      optimisticBoard[boardPosition] = freshPet;
    }

    // Buying one half of a chained level-up reward removes the other half.
    const removedPetIdx = shop.shopPets.flatMap((p, i) =>
      i === shopPosition || (shopPet.chainId && p.chainId === shopPet.chainId) ? [i] : []
    );
    const newShopPets = shop.shopPets.filter((_, i) => !removedPetIdx.includes(i));
    const optimisticShop: ShopState = { shopPets: newShopPets, shopFoods: shop.shopFoods };

    const prevBoard = board, prevShop = shop, prevGold = gold, prevFrozen = frozenPets;
    setBoard(optimisticBoard);
    setShop(optimisticShop);
    setFrozenPets(removeFrozenIndices(frozenPets, removedPetIdx));
    setGold(gold - cost);
    setSelectedItem(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/game/${gameId}/buy-pet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopPosition,
          boardPosition,
          ...frozenBody,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBoard(prevBoard); setShop(prevShop); setGold(prevGold); setFrozenPets(prevFrozen);
        setError(data.error ?? "Something went wrong");
        return;
      }
      setBoard(data.board as Board);
      setShop(data.shop as ShopState);
      setGold(data.gold);
      const synced = frozenFromShop(data.shop as ShopState);
      setFrozenPets(synced.pets);
      setFrozenFoods(synced.foods);
    } catch {
      setBoard(prevBoard); setShop(prevShop); setGold(prevGold); setFrozenPets(prevFrozen);
    } finally {
      setLoading(false);
    }
  }

  async function handleBuyFood(shopPosition: number, boardPosition?: number) {
    const shopFood = shop.shopFoods[shopPosition];
    if (!shopFood) return;
    const foodDef = FOOD_MAP[shopFood.type];
    if (!foodDef) return;

    const cost = getFoodCost(shopFood, foodDef);
    if (gold < cost) { setError("Not enough gold"); return; }

    const feedProblem = feedError(foodDef, board, boardPosition);
    if (feedProblem) { setError(feedProblem); return; }

    // Random-target foods leave the board alone until the server picks the
    // pets, so the preview never shows the wrong ones.
    const optimisticBoard = needsTarget(foodDef)
      ? applyFoodEffect(foodDef, board, boardPosition, PET_MAP)
      : board;

    const newShopFoods = [...shop.shopFoods];
    newShopFoods.splice(shopPosition, 1);
    const optimisticShop: ShopState = { shopPets: shop.shopPets, shopFoods: newShopFoods };

    const prevBoard = board, prevShop = shop, prevGold = gold, prevFrozen = frozenFoods;
    setBoard(optimisticBoard);
    setShop(optimisticShop);
    setFrozenFoods(removeFrozenIndices(frozenFoods, [shopPosition]));
    setGold(gold - cost);
    setSelectedItem(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/game/${gameId}/buy-food`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopPosition, boardPosition, ...frozenBody }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBoard(prevBoard); setShop(prevShop); setGold(prevGold); setFrozenFoods(prevFrozen);
        setError(data.error ?? "Something went wrong");
        return;
      }
      setBoard(data.board as Board);
      setShop(data.shop as ShopState);
      setGold(data.gold);
      const synced = frozenFromShop(data.shop as ShopState);
      setFrozenPets(synced.pets);
      setFrozenFoods(synced.foods);
    } catch {
      setBoard(prevBoard); setShop(prevShop); setGold(prevGold); setFrozenFoods(prevFrozen);
    } finally {
      setLoading(false);
    }
  }

  async function handleMove(targetPosition: number) {
    if (selectedBoardIndex === null) return;

    const optimisticBoard = applyReorder(board, selectedBoardIndex, targetPosition);
    const prevBoard = board;
    setBoard(optimisticBoard);
    setSelectedBoardIndex(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/game/${gameId}/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: selectedBoardIndex,
          to: targetPosition,
          ...frozenBody,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBoard(prevBoard);
        setError(data.error ?? "Something went wrong");
        return;
      }
      setBoard(data.board as Board);
      setShop(data.shop as ShopState);
      const synced = frozenFromShop(data.shop as ShopState);
      setFrozenPets(synced.pets);
      setFrozenFoods(synced.foods);
    } catch {
      setBoard(prevBoard);
    } finally {
      setLoading(false);
    }
  }

  async function handleMerge(targetPosition: number) {
    if (selectedBoardIndex === null) return;

    const petFrom = board[selectedBoardIndex];
    const petTo = board[targetPosition];
    if (!petFrom || !petTo) return;

    const merged = mergePets(petFrom, petTo);
    const optimisticBoard: Board = [...board];
    optimisticBoard[targetPosition] = merged;
    optimisticBoard[selectedBoardIndex] = null;

    const prevBoard = board;
    setBoard(optimisticBoard);
    setSelectedBoardIndex(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/game/${gameId}/merge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from: selectedBoardIndex, to: targetPosition, ...frozenBody }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBoard(prevBoard);
        setError(data.error ?? "Something went wrong");
        return;
      }
      setBoard(data.board as Board);
      setShop(data.shop as ShopState);
      setGold(data.gold);
      const synced = frozenFromShop(data.shop as ShopState);
      setFrozenPets(synced.pets);
      setFrozenFoods(synced.foods);
    } catch {
      setBoard(prevBoard);
    } finally {
      setLoading(false);
    }
  }

  async function handleSellPet() {
    if (selectedBoardIndex === null) return;

    const pet = board[selectedBoardIndex];
    if (!pet) return;

    const goldGain = getSellValue(pet);
    const optimisticBoard: Board = [...board];
    optimisticBoard[selectedBoardIndex] = null;

    const prevBoard = board, prevGold = gold;
    setBoard(optimisticBoard);
    setGold(gold + goldGain);
    setSelectedBoardIndex(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/game/${gameId}/sell-pet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boardPosition: selectedBoardIndex,
          ...frozenBody,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBoard(prevBoard); setGold(prevGold);
        setError(data.error ?? "Something went wrong");
        return;
      }
      setBoard(data.board as Board);
      setShop(data.shop as ShopState);
      setGold(data.gold);
      const synced = frozenFromShop(data.shop as ShopState);
      setFrozenPets(synced.pets);
      setFrozenFoods(synced.foods);
    } catch {
      setBoard(prevBoard); setGold(prevGold);
    } finally {
      setLoading(false);
    }
  }

  async function handleRoll() {
    setLoading(true);
    try {
      const res = await fetch(`/api/game/${gameId}/roll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...frozenBody,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      setShop(data.shop as ShopState);
      setGold(data.gold);
      const synced = frozenFromShop(data.shop as ShopState);
      setFrozenPets(synced.pets);
      setFrozenFoods(synced.foods);
    } finally {
      setLoading(false);
    }
  }

  async function handleEndTurn() {
    setLoading(true);
    try {
      const endRes = await fetch(`/api/game/${gameId}/end`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...frozenBody,
        }),
      });
      const endData = await endRes.json();
      if (!endRes.ok) {
        setError(endData.error ?? "Something went wrong");
        return;
      }

      const watchRes = await fetch(
        `/api/game/${gameId}/watch/${endData.battleId}`
      );
      const battle = await watchRes.json();
      setBattleData(battle);
      setNextState(endData.nextState ?? null);
      setGameWon(endData.gameStatus === "WON");
      setPhase("battle");
    } finally {
      setLoading(false);
    }
  }

  function handleBackToShop() {
    if (nextState && nextState.lives > 0) {
      setBoard(nextState.board as Board);
      setShop(nextState.shop as ShopState);
      setGold(nextState.gold);
      setLives(nextState.lives);
      setTrophies(nextState.trophies);
      setTurn(nextState.turn);
      const nextShop = nextState.shop as ShopState;
      const nextFrozen = frozenFromShop(nextShop);
      setFrozenPets(nextFrozen.pets);
      setFrozenFoods(nextFrozen.foods);
      setBattleData(null);
      setNextState(null);
      setSelectedItem(null);
      setSelectedBoardIndex(null);
      setPhase("shop");
    } else {
      router.refresh();
    }
  }

  const hasShopSelection = selectedItem !== null;
  const hasBoardSelection = selectedBoardIndex !== null && selectedItem === null;

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 dark:bg-black font-sans py-8 px-4">
      <div className="w-full max-w-2xl flex flex-col gap-6">
        {/* Error banner */}
        {error && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-md bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400"
          >
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto font-bold leading-none"
            >
              ✕
            </button>
          </div>
        )}

        {/* HUD */}
        <div className="flex items-center justify-between text-sm font-medium text-zinc-600 dark:text-zinc-400">
          <span>
            Lives: {Array.from({ length: lives }, (_, i) => (
              <span key={i} className="text-red-500">♥</span>
            ))}
            {Array.from({ length: STARTING_LIVES - lives }, (_, i) => (
              <span key={i} className="text-zinc-300 dark:text-zinc-600">♥</span>
            ))}
          </span>
          <span>Turn {turn}</span>
          <span>Trophies: {trophies}</span>
          <span className="font-bold text-yellow-600 dark:text-yellow-400">{gold}g</span>
        </div>

        {phase === "shop" ? (
          <>
            {/* Board */}
            <div>
              <p className="text-xs text-zinc-400 mb-2 uppercase tracking-wide">Your Team</p>
              <div className="flex gap-2 justify-center">
                {Array.from({ length: 5 }, (_, displayIdx) => {
                  const i = 4 - displayIdx;
                  const pet = board[i];
                  const isOtherSlot = hasBoardSelection && i !== selectedBoardIndex;
                  const canMerge =
                    isOtherSlot &&
                    pet !== null &&
                    pet.type === board[selectedBoardIndex!]!.type;
                  return (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <BoardSlot
                        pet={pet}
                        sprite={pet ? (PET_SPRITES[pet.type] ?? null) : null}
                        isSelected={selectedBoardIndex === i}
                        isTargetable={
                          hasShopSelection &&
                          (selectedItem!.kind === "pet"
                            ? true
                            : pet !== null && selectedFoodNeedsTarget)
                        }
                        onClick={() => handleBoardSlotClick(i)}
                      />
                      {pet && (
                        <span className="text-xs text-zinc-400">sells {getSellValue(pet)}g</span>
                      )}
                      {isOtherSlot && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleMove(i)}
                            disabled={loading}
                            className="text-xs px-2 py-0.5 rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40 transition-colors"
                          >
                            Move
                          </button>
                          {canMerge && (
                            <button
                              onClick={() => handleMerge(i)}
                              disabled={loading}
                              className="text-xs px-2 py-0.5 rounded bg-purple-500 text-white hover:bg-purple-600 disabled:opacity-40 transition-colors"
                            >
                              Merge
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {selectedBoardIndex !== null && board[selectedBoardIndex] && (
                <div className="flex justify-center mt-3">
                  <button
                    onClick={handleSellPet}
                    disabled={loading}
                    className="px-4 py-1.5 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700 disabled:opacity-40 transition-colors"
                  >
                    Sell (+{getSellValue(board[selectedBoardIndex]!)}g)
                  </button>
                </div>
              )}
            </div>

            {/* Shop */}
            <div className="flex gap-4 min-w-0">
              {/* Pet shop */}
              <div className="min-w-0">
                <p className="text-xs text-zinc-400 mb-3 uppercase tracking-wide">Pet Shop</p>
                <div className="flex gap-3 pb-8 overflow-x-auto">
                  {shop.shopPets.map((pet, i) => {
                    const def = PET_MAP[pet.type];
                    const atk = def?.baseAttack ?? "?";
                    const hp = (def?.baseHealth ?? 0) + (pet.tempHealthBonus ?? 0);
                    return <ShopItem
                      key={i}
                      name={pet.type}
                      sprite={PET_SPRITES[pet.type] ?? null}
                      subtitle={`${atk}/${hp}`}
                      price={getPetCost(pet)}
                      discounted={!!pet.discount}
                      description={
                        (getPetDescription(def, 1) ?? "") +
                        (pet.chainId ? " (Level up reward: buying one removes the other.)" : "")
                      }
                      chained={!!pet.chainId}
                      isSelected={selectedItem?.kind === "pet" && selectedItem.index === i}
                      isFrozen={frozenPets.has(i)}
                      onSelect={() => handleSelectShopPet(i)}
                      onFreeze={() => handleFreezeToggle("pet", i)}
                      onContextMenu={(e) => handleContextMenu(e, "pet", i)}
                    />;
                  })}
                </div>
              </div>

              {/* Food shop */}
              <div className="shrink-0">
                <p className="text-xs text-zinc-400 mb-3 uppercase tracking-wide">Food Shop</p>
                <div className="flex gap-3 pb-8 overflow-x-auto">
                  {shop.shopFoods.map((food, i) => {
                    const def = FOOD_MAP[food.type];
                    let subtitle = "";
                    if (def?.isPerk) {
                      subtitle = "Perk";
                    } else if (def) {
                      const a = def.effect.attack;
                      const h = def.effect.health;
                      if (a && h) subtitle = `+${a}/+${h}`;
                      else if (a) subtitle = `+${a} atk`;
                      else if (h) subtitle = `+${h} hp`;
                    }
                    return <ShopItem
                      key={i}
                      name={food.type}
                      sprite={FOOD_SPRITES[food.type] ?? null}
                      subtitle={subtitle}
                      price={def ? getFoodCost(food, def) : 0}
                      discounted={!!food.discount}
                      description={def?.description ?? ""}
                      isSelected={selectedItem?.kind === "food" && selectedItem.index === i}
                      isFrozen={frozenFoods.has(i)}
                      onSelect={() => handleSelectShopFood(i)}
                      onFreeze={() => handleFreezeToggle("food", i)}
                      onBuy={def && !needsTarget(def) ? () => handleBuyFood(i) : undefined}
                      onContextMenu={(e) => handleContextMenu(e, "food", i)}
                    />;
                  })}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between">
              <button
                onClick={handleRoll}
                disabled={loading || gold < ROLL_COST}
                className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-40 transition-colors"
              >
                Roll ({ROLL_COST}g)
              </button>
              <button
                onClick={handleEndTurn}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm hover:bg-zinc-700 dark:hover:bg-zinc-200 disabled:opacity-40 transition-colors"
              >
                {loading ? "…" : "End Turn"}
              </button>
            </div>
          </>
        ) : (
          battleData && (
            <BattleView battleData={battleData} gameWon={gameWon} onBackToShop={handleBackToShop} />
          )
        )}
      </div>
    </div>
  );
}
